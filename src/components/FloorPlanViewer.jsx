import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { X, ZoomIn, ZoomOut, Move, Grid3X3, Download } from 'lucide-react';
import { getFloorPlan } from '../firebase/firestore';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import '../styles/FloorPlan.css';

const CELL_SIZE = 40; // px per meter
const MIN_ZOOM = 0.2;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.15;
const GATE_PADDING = 60; // px of white space outside the grid for entrance/exit markers

const loadImage = (url) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
};

export default function FloorPlanViewer({ isOpen, onClose, eventId, sponsorTiers = [] }) {
  const [floorPlan, setFloorPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailBooth, setDetailBooth] = useState(null);
  const [isExporting, setIsExporting] = useState(false);

  // Zoom/Pan
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  const gridAreaRef = useRef(null);

  // Load floor plan
  useEffect(() => {
    if (!isOpen || !eventId) return;
    setLoading(true);
    getFloorPlan(eventId).then(data => {
      setFloorPlan(data);
      setLoading(false);
      // Short delay to ensure DOM is ready for fitZoom
      setTimeout(() => fitZoom(data), 100);
    }).catch(() => {
      setFloorPlan(null);
      setLoading(false);
    });
  }, [isOpen, eventId]);

  const fitZoom = useCallback((fp = floorPlan) => {
    if (!gridAreaRef.current || !fp) return;
    const areaRect = gridAreaRef.current.getBoundingClientRect();
    if (areaRect.width === 0) return;

    const totalW = fp.width * CELL_SIZE + GATE_PADDING * 2;
    const totalH = fp.height * CELL_SIZE + GATE_PADDING * 2;
    const scaleX = (areaRect.width - 60) / totalW;
    const scaleY = (areaRect.height - 60) / totalH;
    const fitScale = Math.min(scaleX, scaleY, 1.5);
    
    setZoom(Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, fitScale)));
    setPan({ x: 0, y: 0 });
  }, [floorPlan]);

  // Auto-fit zoom on resize
  useEffect(() => {
    if (!isOpen || loading || !floorPlan) return;
    window.addEventListener('resize', () => fitZoom());
    return () => window.removeEventListener('resize', () => fitZoom());
  }, [isOpen, loading, floorPlan, fitZoom]);

  // Pan handlers
  const handlePointerDown = useCallback((e) => {
    if (e.target.closest('.fp-booth')) return;
    setIsPanning(true);
    panStart.current = {
      x: e.clientX,
      y: e.clientY,
      panX: pan.x,
      panY: pan.y
    };
  }, [pan]);

  const handlePointerMove = useCallback((e) => {
    if (!isPanning || touchCount.current > 1) return;
    const dx = e.clientX - panStart.current.x;
    const dy = e.clientY - panStart.current.y;
    setPan({
      x: panStart.current.panX + dx,
      y: panStart.current.panY + dy
    });
  }, [isPanning]);

  const handlePointerUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isOpen, handlePointerMove, handlePointerUp]);

  // Zoom with wheel
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    setZoom(prev => {
      const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
      return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, prev + delta));
    });
  }, []);

  useEffect(() => {
    const el = gridAreaRef.current;
    if (!el || !isOpen) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [isOpen, handleWheel]);

  const handleFocusBooth = useCallback((booth) => {
    if (!gridAreaRef.current || !floorPlan) return;
    
    // Calculate total wrapper size including padding
    const totalW = floorPlan.width * CELL_SIZE + GATE_PADDING * 2;
    const totalH = floorPlan.height * CELL_SIZE + GATE_PADDING * 2;
    
    // Wrapper center in its own coordinate system
    const wrapperCenterX = totalW / 2;
    const wrapperCenterY = totalH / 2;
    
    // Booth center in wrapper coordinate system
    const boothCenterX = (booth.x + booth.widthM / 2) * CELL_SIZE + GATE_PADDING;
    const boothCenterY = (booth.y + booth.heightM / 2) * CELL_SIZE + GATE_PADDING;

    const newZoom = 1.8;
    setZoom(newZoom);
    
    // Pan is the offset from the "natural" centered position
    // If booth is at center, pan is 0. 
    // If booth is to the right of center, we pan left (negative x)
    setPan({
      x: (wrapperCenterX - boothCenterX) * newZoom,
      y: (wrapperCenterY - boothCenterY) * newZoom
    });
    
    const modalBody = document.querySelector('.fp-body');
    if (modalBody) modalBody.scrollTo({ top: 0, behavior: 'smooth' });
  }, [floorPlan]);

  const handleExportPDF = async () => {
    if (!gridAreaRef.current || !floorPlan) return;
    setIsExporting(true);
    try {
      const pdf = new jsPDF('l', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // 1. Capture Floor Plan
      // Temporarily set zoom/pan to see full plan for capture if possible, or just capture current view
      const canvas = await html2canvas(gridAreaRef.current, {
        useCORS: true,
        scale: 2,
        backgroundColor: '#f8f9fa'
      });
      const imgData = canvas.toDataURL('image/png');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfImgHeight = (imgProps.height * pageWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, Math.min(pageHeight, pdfImgHeight));
      
      // 2. Add Booth List on new page
      pdf.addPage('p', 'mm', 'a4');
      pdf.setFontSize(18);
      pdf.setTextColor(227, 30, 36);
      pdf.text('Booth Details Directory', 20, 20);
      
      pdf.setFontSize(11);
      pdf.setTextColor(26, 26, 46);
      
      const sortedBooths = [...(floorPlan.booths || [])].sort((a, b) => 
        a.boothNumber.localeCompare(b.boothNumber, undefined, { numeric: true })
      );

      let yPos = 35;
      for (const b of sortedBooths) {
        if (yPos > 280) {
          pdf.addPage('p', 'mm', 'a4');
          yPos = 20;
        }

        // Add logo if exists
        if (b.logo) {
          try {
            const img = await loadImage(b.logo);
            pdf.addImage(img, 'PNG', 20, yPos - 6, 8, 8);
          } catch (err) {
            console.warn('Could not load logo for PDF:', b.name);
          }
        }

        pdf.setFont('helvetica', 'bold');
        pdf.text(`${b.boothNumber}`, 32, yPos);
        pdf.setFont('helvetica', 'normal');
        pdf.text(` - ${b.name}`, 45, yPos);
        yPos += 12;
      }

      pdf.save(`FloorPlan_${eventId}.pdf`);
    } catch (error) {
      console.error('PDF Export failed:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const lastTouchDist = useRef(null);
  const touchCount = useRef(0);
  const pinchStartDist = useRef(null);
  const pinchStartZoom = useRef(null);

  const handleTouchStart = useCallback((e) => {
    touchCount.current = e.touches.length;
    if (e.touches.length === 2) {
      setIsPanning(false);
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      pinchStartDist.current = dist;
      pinchStartZoom.current = zoom;
    }
  }, [zoom]);

  const handleTouchMove = useCallback((e) => {
    if (e.touches.length === 2 && pinchStartDist.current !== null) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      
      // Calculate zoom relative to start for maximum stability
      const scale = dist / pinchStartDist.current;
      const nextZoom = pinchStartZoom.current * scale;
      setZoom(Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, nextZoom)));
    }
  }, []);

  const handleTouchEnd = useCallback((e) => {
    touchCount.current = e.touches.length;
    pinchStartDist.current = null;
    pinchStartZoom.current = null;
  }, []);

  useEffect(() => {
    const el = gridAreaRef.current;
    if (!el || !isOpen) return;
    el.addEventListener('touchstart', handleTouchStart, { passive: false });
    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    el.addEventListener('touchend', handleTouchEnd);
    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isOpen, handleTouchStart, handleTouchMove, handleTouchEnd]);

  if (!isOpen) return null;

  const gridWidth = floorPlan?.width || 0;
  const gridHeight = floorPlan?.height || 0;
  const booths = floorPlan?.booths || [];
  const gridPxW = gridWidth * CELL_SIZE;
  const gridPxH = gridHeight * CELL_SIZE;

  return (
    <div className="fp-overlay" onClick={onClose}>
      <div className="fp-container viewer-mode" onClick={e => e.stopPropagation()}>
        {/* Top Bar */}
        <div className="fp-topbar">
          <div className="fp-topbar-left">
            <Grid3X3 size={20} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
            <h2>Floor Plan</h2>
            {floorPlan && (
              <span style={{ fontSize: '0.8rem', color: '#868e96', whiteSpace: 'nowrap' }}>
                {gridWidth}m × {gridHeight}m
              </span>
            )}
          </div>
          <div className="fp-topbar-actions">
            <button 
              className="fp-btn fp-btn-secondary" 
              onClick={handleExportPDF}
              disabled={isExporting}
              style={{ marginRight: '8px' }}
            >
              <Download size={16} style={{ marginRight: '6px' }} />
              {isExporting ? 'Exporting...' : 'Export PDF'}
            </button>
            <button className="fp-close-btn" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="fp-empty-state">
            <p>Loading floor plan...</p>
          </div>
        ) : !floorPlan ? (
          <div className="fp-empty-state">
            <Grid3X3 size={48} />
            <p>No floor plan available for this event yet.</p>
          </div>
        ) : (
          <>
            <div className="fp-body">
              {/* Grid Area */}
              <div
                className="fp-grid-area"
                ref={gridAreaRef}
                onPointerDown={handlePointerDown}
                style={{ 
                  cursor: isPanning ? 'grabbing' : 'grab',
                  touchAction: 'none'
                }}
              >
                <div
                  className="fp-grid-wrapper"
                  style={{
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                    padding: `${GATE_PADDING}px`,
                    width: `${gridPxW + GATE_PADDING * 2}px`,
                    height: `${gridPxH + GATE_PADDING * 2}px`,
                    flexShrink: 0
                  }}
                >
                  {/* Gate markers rendered in the padding area */}
                  {(floorPlan.gates || []).map(gate => {
                    const isEntrance = gate.type === 'entrance';
                    const color = isEntrance ? '#10B981' : '#EF4444';
                    const gateW = gate.widthM * CELL_SIZE;
                    let style = {};
                    let arrowStyle = {};

                    if (gate.side === 'top') {
                      style = {
                        position: 'absolute',
                        left: `${GATE_PADDING + gate.position * CELL_SIZE}px`,
                        top: '0px',
                        width: `${gateW}px`,
                        height: `${GATE_PADDING - 4}px`,
                      };
                      arrowStyle = { borderBottom: `8px solid ${color}`, borderLeft: '6px solid transparent', borderRight: '6px solid transparent' };
                    } else if (gate.side === 'bottom') {
                      style = {
                        position: 'absolute',
                        left: `${GATE_PADDING + gate.position * CELL_SIZE}px`,
                        bottom: '0px',
                        width: `${gateW}px`,
                        height: `${GATE_PADDING - 4}px`,
                      };
                      arrowStyle = { borderTop: `8px solid ${color}`, borderLeft: '6px solid transparent', borderRight: '6px solid transparent' };
                    } else if (gate.side === 'left') {
                      style = {
                        position: 'absolute',
                        left: '0px',
                        top: `${GATE_PADDING + gate.position * CELL_SIZE}px`,
                        width: `${GATE_PADDING - 4}px`,
                        height: `${gateW}px`,
                      };
                      arrowStyle = { borderRight: `8px solid ${color}`, borderTop: '6px solid transparent', borderBottom: '6px solid transparent' };
                    } else {
                      style = {
                        position: 'absolute',
                        right: '0px',
                        top: `${GATE_PADDING + gate.position * CELL_SIZE}px`,
                        width: `${GATE_PADDING - 4}px`,
                        height: `${gateW}px`,
                      };
                      arrowStyle = { borderLeft: `8px solid ${color}`, borderTop: '6px solid transparent', borderBottom: '6px solid transparent' };
                    }

                    return (
                      <div
                        key={gate.id}
                        className="fp-gate-marker"
                        style={style}
                      >
                        <div className="fp-gate-arrow" style={arrowStyle} />
                        <div className="fp-gate-label" style={{ color }}>{gate.label}</div>
                      </div>
                    );
                  })}

                  <div
                    className="fp-grid"
                    style={{
                      width: `${gridPxW}px`,
                      height: `${gridPxH}px`,
                    }}
                  >
                    {/* Horizontal grid lines */}
                    <div className="fp-grid-lines-h">
                      {Array.from({ length: gridHeight - 1 }, (_, i) => (
                        <div
                          key={i}
                          className="fp-grid-line-h"
                          style={{ top: `${(i + 1) * CELL_SIZE}px` }}
                        />
                      ))}
                    </div>

                    {/* Vertical grid lines */}
                    <div className="fp-grid-lines-v">
                      {Array.from({ length: gridWidth - 1 }, (_, i) => (
                        <div
                          key={i}
                          className="fp-grid-line-v"
                          style={{ left: `${(i + 1) * CELL_SIZE}px` }}
                        />
                      ))}
                    </div>

                    {/* Top labels */}
                    <div className="fp-labels-top">
                      {Array.from({ length: gridWidth }, (_, i) => (
                        <div
                          key={i}
                          className="fp-label"
                          style={{ width: `${CELL_SIZE}px` }}
                        >
                          {i + 1}
                        </div>
                      ))}
                    </div>

                    {/* Left labels */}
                    <div className="fp-labels-left">
                      {Array.from({ length: gridHeight }, (_, i) => (
                        <div
                          key={i}
                          className="fp-label"
                          style={{ height: `${CELL_SIZE}px` }}
                        >
                          {i + 1}
                        </div>
                      ))}
                    </div>

                    {/* Booths */}
                    {booths.map(booth => (
                      <Booth 
                        key={booth.id}
                        booth={booth}
                        onDetail={setDetailBooth}
                      />
                    ))}
                  </div>
                </div>
              </div>



              {/* Booth Details Directory */}
              <div className="fp-directory">
                <div className="fp-directory-header">
                  <h3>Booth Details Directory</h3>
                  <p>Click on any exhibitor to locate them on the floor plan</p>
                </div>
                <div className="fp-directory-grid">
                  {[...(floorPlan.booths || [])]
                    .sort((a, b) => a.boothNumber.localeCompare(b.boothNumber, undefined, { numeric: true }))
                    .map(b => (
                      <div 
                        key={b.id} 
                        className="fp-directory-card"
                        onClick={() => handleFocusBooth(b)}
                      >
                        <div className="fp-directory-card-logo">
                          {b.logo ? (
                            <img src={b.logo} alt="" />
                          ) : null}
                        </div>
                        <div className="fp-directory-card-info">
                          <span className="fp-directory-card-number">{b.boothNumber}</span>
                          <span className="fp-directory-card-divider">|</span>
                          <span className="fp-directory-card-name">{b.name}</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {/* Sticky Zoom Controls for Viewer */}
            <div className="fp-zoom-controls fp-zoom-controls-viewer">
              <button onClick={() => setZoom(z => Math.min(MAX_ZOOM, z + ZOOM_STEP))}>
                <ZoomIn size={16} />
              </button>
              <div className="fp-zoom-level">{Math.round(zoom * 100)}%</div>
              <button onClick={() => setZoom(z => Math.max(MIN_ZOOM, z - ZOOM_STEP))}>
                <ZoomOut size={16} />
              </button>
              <button onClick={fitZoom} title="Fit to View" style={{ marginTop: '4px' }}>
                <Move size={16} />
              </button>
            </div>
          </>
        )}

        {/* Booth Detail Modal */}
        {detailBooth && (
          <div className="fp-booth-detail-overlay" onClick={() => setDetailBooth(null)}>
            <div className="fp-booth-detail" onClick={e => e.stopPropagation()}>
              <button className="fp-close-btn" onClick={() => setDetailBooth(null)}>
                <X size={16} />
              </button>
              {detailBooth.sponsorType && (
                <div 
                  className="fp-booth-detail-tier" 
                  style={{ 
                    color: sponsorTiers.find(t => t.label === detailBooth.sponsorType)?.color || detailBooth.color, 
                    fontWeight: 800, 
                    fontSize: '0.85rem', 
                    marginBottom: '8px', 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.5px' 
                  }}
                >
                  {detailBooth.sponsorType}
                </div>
              )}

              {detailBooth.logo && (
                <div className="fp-booth-detail-logo">
                  <img src={detailBooth.logo} alt={detailBooth.name} />
                </div>
              )}

              <h3>{detailBooth.name}</h3>
              <div className="fp-booth-detail-number">Booth {detailBooth.boothNumber}</div>
              
              <div className="fp-booth-detail-meta">
                {detailBooth.name !== 'Available' && (
                  <div className="fp-booth-detail-meta-item">
                    <strong>Exhibitor:</strong>
                    <span>{detailBooth.name}</span>
                  </div>
                )}
                <div className="fp-booth-detail-meta-item">
                  <strong>Size:</strong>
                  <span>{detailBooth.widthM}m × {detailBooth.heightM}m ({detailBooth.widthM * detailBooth.heightM} m²)</span>
                </div>
                <div className="fp-booth-detail-meta-item">
                  <strong>Position:</strong>
                  <span>Row {detailBooth.y + 1}, Col {detailBooth.x + 1}</span>
                </div>
                <div className="fp-booth-detail-meta-item">
                  <strong>Color:</strong>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '14px', height: '14px', borderRadius: '4px', background: detailBooth.color, display: 'inline-block', border: '1px solid rgba(0,0,0,0.1)' }} />
                    {detailBooth.color}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function getContrastColor(hex) {
  if (!hex) return '#fff';
  const c = hex.startsWith('#') ? hex.slice(1) : hex;
  if (c.length !== 6) return '#fff';
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 155 ? '#1a1a2e' : '#ffffff';
}

const Booth = memo(({ booth, onDetail }) => {
  const bW = booth.widthM * CELL_SIZE;
  const bH = booth.heightM * CELL_SIZE;
  const textColor = getContrastColor(booth.color);

  return (
    <div
      className="fp-booth"
      style={{
        left: `${booth.x * CELL_SIZE}px`,
        top: `${booth.y * CELL_SIZE}px`,
        width: `${bW}px`,
        height: `${bH}px`,
        background: booth.color,
        color: textColor,
      }}
      onClick={(e) => {
        e.stopPropagation();
        onDetail(booth);
      }}
    >
      <div className="fp-booth-number">{booth.boothNumber}</div>
      {(bW > 50 || bH > 50) && (
        <div className="fp-booth-name">{booth.name}</div>
      )}
    </div>
  );
});
