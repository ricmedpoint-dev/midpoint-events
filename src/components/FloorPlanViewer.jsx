import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { X, ZoomIn, ZoomOut, Move, Grid3X3, Download, ChevronDown } from 'lucide-react';
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

export default function FloorPlanViewer({ isOpen, onClose, eventId, sponsorTiers = [], event, exhibitors = [] }) {
  const resolveBoothData = useCallback((booth) => {
    // 1. Try to find exhibitor by ID (best way)
    let exhibitor = booth.exhibitorId ? exhibitors.find(ex => ex.id === booth.exhibitorId) : null;
    
    // 2. If not found by ID, try matching by name (migration for existing data)
    if (!exhibitor && booth.name && booth.name !== 'Available' && booth.name !== 'TBD') {
      exhibitor = exhibitors.find(ex => ex.name === booth.name);
    }

    if (exhibitor) {
      return {
        ...booth,
        name: exhibitor.name,
        logo: exhibitor.logo,
        sponsorType: exhibitor.sponsorType,
        exhibitorId: exhibitor.id // Ensure ID is present for future
      };
    }
    
    // 3. If it HAD an exhibitorId but no exhibitor was found, it was deleted
    if (booth.exhibitorId) {
      return {
        ...booth,
        name: 'Available',
        logo: null,
        sponsorType: null,
        color: '#f1f3f5'
      };
    }
    
    return booth;
  }, [exhibitors]);
  const [floorPlan, setFloorPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailBooth, setDetailBooth] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [focusedBoothId, setFocusedBoothId] = useState(null);

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
    if (!areaRect || areaRect.width === 0) return;

    const totalW = (Number(fp.width) || 10) * CELL_SIZE + GATE_PADDING * 2;
    const totalH = (Number(fp.height) || 10) * CELL_SIZE + GATE_PADDING * 2;
    const scaleX = (areaRect.width - 60) / totalW;
    const scaleY = (areaRect.height - 60) / totalH;
    let fitScale = Math.min(scaleX, scaleY, 1.5);
    
    if (isNaN(fitScale) || !isFinite(fitScale)) fitScale = 1;

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
    setFocusedBoothId(null);
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
    
    setFocusedBoothId(booth.id);
    
    // Calculate total wrapper size including padding
    const totalW = floorPlan.width * CELL_SIZE + GATE_PADDING * 2;
    const totalH = floorPlan.height * CELL_SIZE + GATE_PADDING * 2;
    
    // Wrapper center in its own coordinate system
    const wrapperCenterX = totalW / 2;
    const wrapperCenterY = totalH / 2;
    
    // Booth center in wrapper coordinate system
    const boothCenterX = (booth.x + booth.widthM / 2) * CELL_SIZE + GATE_PADDING;
    const boothCenterY = (booth.y + booth.heightM / 2) * CELL_SIZE + GATE_PADDING;

    const newZoom = 0.5;
    setZoom(newZoom);
    
    // Pan is the offset from the "natural" centered position
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
      // Color helper
      const hexToRgb = (hex) => {
        const c = hex?.startsWith('#') ? hex.slice(1) : hex;
        if (c?.length !== 6) return { r: 227, g: 30, b: 36 }; 
        return {
          r: parseInt(c.slice(0, 2), 16),
          g: parseInt(c.slice(2, 4), 16),
          b: parseInt(c.slice(4, 6), 16)
        };
      };
      const hColor = hexToRgb(event?.eventColor || '#E31E24');

      // 1. Setup PDF Orientation based on Floor Plan aspect ratio
      const totalW = (Number(floorPlan.width) || 10) * CELL_SIZE + GATE_PADDING * 2;
      const totalH = (Number(floorPlan.height) || 10) * CELL_SIZE + GATE_PADDING * 2;
      const orientation = totalW > totalH ? 'l' : 'p';
      
      const pdf = new jsPDF(orientation, 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - (margin * 2);

      // ── Page 1 Header ──
      pdf.setFillColor(hColor.r, hColor.g, hColor.b); 
      pdf.rect(0, 0, pageWidth, 25, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text(event?.title || 'Event Floor Plan', margin, 12);
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`${event?.date || ''} | ${event?.location || ''}`, margin, 18);
      
      pdf.setFontSize(12);
      pdf.text('OFFICIAL FLOOR PLAN', pageWidth - margin, 15, { align: 'right' });

      // Add Logo to Header if available
      if (event?.image || event?.mediaUrl) {
        try {
          const logoImg = await loadImage(event.image || event.mediaUrl);
          // Small square logo on the right side of header
          pdf.addImage(logoImg, 'PNG', pageWidth - margin - 50, 4, 16, 16);
        } catch (e) {
          console.warn('Could not load event logo for PDF');
        }
      }

      // ── Capture Floor Plan ──
      // Use onclone to reset transforms and capture the FULL grid
      const canvas = await html2canvas(gridAreaRef.current, {
        useCORS: true,
        scale: 2,
        backgroundColor: '#ffffff',
        onclone: (clonedDoc) => {
          const wrapper = clonedDoc.querySelector('.fp-grid-wrapper');
          if (wrapper) {
            wrapper.style.transform = 'none';
            wrapper.style.position = 'static';
            wrapper.style.margin = '0';
            wrapper.style.padding = `${GATE_PADDING}px`;
            
            const area = clonedDoc.querySelector('.fp-grid-area');
            if (area) {
              area.style.width = `${totalW}px`;
              area.style.height = `${totalH}px`;
              area.style.display = 'block';
              area.style.overflow = 'visible';
              area.style.background = '#ffffff';
            }
          }
        }
      });

      const imgData = canvas.toDataURL('image/png');
      const availableHeight = pageHeight - 45; // Space below header and above footer
      
      // Calculate dimensions to fit in available space while maintaining aspect ratio
      let fitW = contentWidth;
      let fitH = (canvas.height * fitW) / canvas.width;
      
      if (fitH > availableHeight) {
        fitH = availableHeight;
        fitW = (canvas.width * fitH) / canvas.height;
      }
      
      const x = (pageWidth - fitW) / 2;
      const y = 30 + (availableHeight - fitH) / 2;
      
      pdf.addImage(imgData, 'PNG', x, y, fitW, fitH);

      // ── Page 1 Footer ──
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.text(`Generated on ${new Date().toLocaleDateString()} | Midpoint Events Floor Plan Viewer`, pageWidth / 2, pageHeight - 8, { align: 'center' });

      // ── Directory Pages ──
      pdf.addPage('p', 'mm', 'a4');
      const dirPageWidth = pdf.internal.pageSize.getWidth();
      const dirPageHeight = pdf.internal.pageSize.getHeight();
      
      // Header for Directory
      pdf.setFillColor(hColor.r, hColor.g, hColor.b);
      pdf.rect(0, 0, dirPageWidth, 20, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Exhibitor Directory', margin, 13);
      
      pdf.setTextColor(26, 26, 46);
      pdf.setFontSize(11);
      
      const sortedBooths = [...(floorPlan.booths || [])]
        .map(resolveBoothData)
        .sort((a, b) => 
          a.boothNumber.localeCompare(b.boothNumber, undefined, { numeric: true })
        );

      let yPos = 35;
      for (const b of sortedBooths) {
        if (yPos > dirPageHeight - 20) {
          pdf.addPage('p', 'mm', 'a4');
          // Re-add header on new page
          pdf.setFillColor(hColor.r, hColor.g, hColor.b);
          pdf.rect(0, 0, dirPageWidth, 20, 'F');
          pdf.setTextColor(255, 255, 255);
          pdf.setFontSize(14);
          pdf.setFont('helvetica', 'bold');
          pdf.text('Exhibitor Directory (continued)', margin, 13);
          pdf.setTextColor(26, 26, 46);
          pdf.setFontSize(11);
          yPos = 35;
        }

        // Add logo if exists
        if (b.logo) {
          try {
            const img = await loadImage(b.logo);
            const imgProps = pdf.getImageProperties(img);
            const maxL = 10;
            let lW = maxL;
            let lH = (imgProps.height * lW) / imgProps.width;
            if (lH > maxL) {
              lH = maxL;
              lW = (imgProps.width * lH) / imgProps.height;
            }
            // Center the contained image within the 10x10 space
            const lX = margin + (maxL - lW) / 2;
            const lY = yPos - (lH / 2) - 3.5; 
            pdf.addImage(img, 'PNG', lX, lY, lW, lH);
          } catch (err) {
            // Silently skip if logo fails
          }
        }

        pdf.setFont('helvetica', 'bold');
        pdf.text(`${b.boothNumber}`, margin + 14, yPos);
        pdf.setFont('helvetica', 'normal');
        pdf.text(` - ${b.name}`, margin + 28, yPos);
        yPos += 14;
      }

      pdf.save(`${(event?.title || 'FloorPlan').replace(/\s+/g, '_')}_${eventId}.pdf`);
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
      
      if (pinchStartDist.current > 0) {
        const scale = dist / pinchStartDist.current;
        const nextZoom = pinchStartZoom.current * scale;
        if (isFinite(nextZoom)) {
          setZoom(Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, nextZoom)));
        }
      }
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
  const booths = (floorPlan?.booths || []).map(resolveBoothData);
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
                        isFocused={focusedBoothId === booth.id}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Directory Hint / Onboarding */}
              <div className="fp-directory-hint">
                <span>Exhibitor Directory Below</span>
                <ChevronDown size={20} className="fp-bounce-icon" />
              </div>

              {/* Booth Details Directory */}
              <div className="fp-directory">
                <div className="fp-directory-header">
                  <h3>Booth Details Directory</h3>
                  <p>Click on any exhibitor to locate them on the floor plan</p>
                </div>
                <div className="fp-directory-grid">
                  {booths
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
        {detailBooth && (() => {
          const resolved = resolveBoothData(detailBooth);
          return (
            <div className="fp-booth-detail-overlay" onClick={() => setDetailBooth(null)}>
              <div className="fp-booth-detail" onClick={e => e.stopPropagation()}>
                <button className="fp-close-btn" onClick={() => setDetailBooth(null)}>
                  <X size={16} />
                </button>
                {resolved.sponsorType && (
                  <div 
                    className="fp-booth-detail-tier" 
                    style={{ 
                      color: sponsorTiers.find(t => t.label === resolved.sponsorType)?.color || resolved.color, 
                      fontWeight: 800, 
                      fontSize: '0.85rem', 
                      marginBottom: '8px', 
                      textTransform: 'uppercase', 
                      letterSpacing: '0.5px' 
                    }}
                  >
                    {resolved.sponsorType.replace(/\/s$/, '')}
                  </div>
                )}

                {resolved.logo && (
                  <div className="fp-booth-detail-logo">
                    <img src={resolved.logo} alt={resolved.name} />
                  </div>
                )}

                <h3>{resolved.name}</h3>
                <div className="fp-booth-detail-number">Booth {resolved.boothNumber}</div>
                
                <div className="fp-booth-detail-meta">
                  {resolved.name !== 'Available' && resolved.name !== 'TBD' && (
                    <div className="fp-booth-detail-meta-item">
                      <strong>Exhibitor:</strong>
                      <span>{resolved.name}</span>
                    </div>
                  )}
                  <div className="fp-booth-detail-meta-item">
                    <strong>Size:</strong>
                    <span>{resolved.widthM}m × {resolved.heightM}m ({resolved.widthM * resolved.heightM} m²)</span>
                  </div>
                  <div className="fp-booth-detail-meta-item">
                    <strong>Position:</strong>
                    <span>Row {resolved.y + 1}, Col {resolved.x + 1}</span>
                  </div>
                  <div className="fp-booth-detail-meta-item">
                    <strong>Color:</strong>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '14px', height: '14px', borderRadius: '4px', background: resolved.color, display: 'inline-block', border: '1px solid rgba(0,0,0,0.1)' }} />
                      {resolved.color}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
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

const Booth = memo(({ booth, onDetail, isFocused }) => {
  const bW = booth.widthM * CELL_SIZE;
  const bH = booth.heightM * CELL_SIZE;
  const textColor = getContrastColor(booth.color);

  return (
    <div
      className={`fp-booth ${isFocused ? 'is-focused' : ''}`}
      style={{
        left: `${booth.x * CELL_SIZE}px`,
        top: `${booth.y * CELL_SIZE}px`,
        width: `${bW}px`,
        height: `${bH}px`,
        background: booth.color,
        color: textColor,
        boxShadow: isFocused ? '0 0 0 3px #ffffff, 0 0 0 6px var(--color-primary), 0 0 20px rgba(0,0,0,0.3)' : 'none',
        zIndex: isFocused ? 50 : 1,
        transition: 'all 0.3s ease'
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
