import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { X, Plus, RotateCw, Save, Trash2, ZoomIn, ZoomOut, Grid3X3, ChevronDown, ChevronUp, Move, DoorOpen, Copy, Edit2, Search } from 'lucide-react';
import { saveFloorPlan, getFloorPlan } from '../firebase/firestore';
import '../styles/FloorPlan.css';

const GATE_PADDING = 60; // px of white space outside the grid for entrance/exit markers

const CELL_SIZE = 40; // px per meter
const MIN_ZOOM = 0.3;
const MAX_ZOOM = 2.5;
const ZOOM_STEP = 0.15;

const DEFAULT_COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'];

function generateId() {
  return 'booth-' + Math.random().toString(36).substr(2, 9);
}

export default function FloorPlanBuilder({ isOpen, onClose, eventId, onSaved, exhibitors = [], sponsorTiers = [] }) {
  // Grid dimensions
  const [gridWidth, setGridWidth] = useState(20);
  const [gridHeight, setGridHeight] = useState(15);
  // Raw input strings so user can freely type without clamping
  const [gridWidthInput, setGridWidthInput] = useState('20');
  const [gridHeightInput, setGridHeightInput] = useState('15');

  // Booths
  const [booths, setBooths] = useState([]);
  const [selectedBoothId, setSelectedBoothId] = useState(null);
  const [editingBoothId, setEditingBoothId] = useState(null);
  const [detailBooth, setDetailBooth] = useState(null);

  // Gates (Entrance/Exit)
  const [gates, setGates] = useState([]);
  const [newGate, setNewGate] = useState({
    type: 'entrance',
    side: 'bottom',
    position: 0,
    widthM: 3,
    label: 'Main Entrance'
  });

  // Add booth form
  const [newBooth, setNewBooth] = useState({
    boothNumber: '',
    name: '',
    widthM: 3,
    heightM: 3,
    color: DEFAULT_COLORS[0],
    useTierColor: true,
    logo: null
  });

  // Drag state
  const [dragging, setDragging] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Zoom/Pan
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  // UI State
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [colorIndex, setColorIndex] = useState(0);
  const [isManualExhibitor, setIsManualExhibitor] = useState(false);

  const gridRef = useRef(null);
  const gridAreaRef = useRef(null);

  // Load existing floor plan
  useEffect(() => {
    if (!isOpen || !eventId) return;
    setLoading(true);
    getFloorPlan(eventId).then(data => {
      if (data) {
        const w = data.width || 20;
        const h = data.height || 15;
        setGridWidth(w);
        setGridHeight(h);
        setGridWidthInput(String(w));
        setGridHeightInput(String(h));
        setBooths(data.booths || []);
        setGates(data.gates || []);
      } else {
        setGridWidth(20);
        setGridHeight(15);
        setGridWidthInput('20');
        setGridHeightInput('15');
        setBooths([]);
        setGates([]);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [isOpen, eventId]);

  // Auto-fit zoom on load
  useEffect(() => {
    if (!isOpen || loading) return;
    fitZoom();
  }, [isOpen, loading, gridWidth, gridHeight]);

  const fitZoom = useCallback(() => {
    if (!gridAreaRef.current) return;
    const areaRect = gridAreaRef.current.getBoundingClientRect();
    const totalW = gridWidth * CELL_SIZE + GATE_PADDING * 2;
    const totalH = gridHeight * CELL_SIZE + GATE_PADDING * 2;
    const scaleX = (areaRect.width - 40) / totalW;
    const scaleY = (areaRect.height - 40) / totalH;
    const fitScale = Math.min(scaleX, scaleY, 1.5);
    setZoom(Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, fitScale)));
    setPan({ x: 0, y: 0 });
  }, [gridWidth, gridHeight]);

  // Grid dimension handlers — allow free typing, clamp on blur
  const handleGridWidthChange = (e) => {
    setGridWidthInput(e.target.value);
  };
  const handleGridWidthBlur = () => {
    const v = Math.max(3, Math.min(200, parseInt(gridWidthInput) || 3));
    setGridWidth(v);
    setGridWidthInput(String(v));
  };
  const handleGridHeightChange = (e) => {
    setGridHeightInput(e.target.value);
  };
  const handleGridHeightBlur = () => {
    const v = Math.max(3, Math.min(200, parseInt(gridHeightInput) || 3));
    setGridHeight(v);
    setGridHeightInput(String(v));
  };

  // Handle save
  const handleSave = async () => {
    setSaving(true);
    try {
      await saveFloorPlan(eventId, {
        width: gridWidth,
        height: gridHeight,
        booths,
        gates
      });
      if (onSaved) onSaved();
      alert('Floor plan saved!');
    } catch (err) {
      alert('Failed to save: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Gate CRUD
  const handleAddGate = (e) => {
    e.preventDefault();
    const maxLen = (newGate.side === 'top' || newGate.side === 'bottom') ? gridWidth : gridHeight;
    const pos = Math.max(0, Math.min(maxLen - (parseInt(newGate.widthM) || 1), parseInt(newGate.position) || 0));
    const gate = {
      id: 'gate-' + Math.random().toString(36).substr(2, 9),
      type: newGate.type,
      side: newGate.side,
      position: pos,
      widthM: Math.max(1, Math.min(maxLen, parseInt(newGate.widthM) || 1)),
      label: newGate.label.trim() || (newGate.type === 'entrance' ? 'Entrance' : 'Exit')
    };
    setGates(prev => [...prev, gate]);
    setNewGate({ type: 'entrance', side: 'bottom', position: 0, widthM: 3, label: '' });
  };

  const handleDeleteGate = (id) => {
    setGates(prev => prev.filter(g => g.id !== id));
  };

  // Add/Update booth
  const handleAddBooth = (e) => {
    e.preventDefault();
    if (!newBooth.boothNumber.trim()) return;

    const finalName = newBooth.name.trim() || 'Available';
    const exhibitor = exhibitors.find(ex => ex.name === finalName);
    const sponsorType = exhibitor?.sponsorType || '';

    if (editingBoothId) {
      // Update existing
      setBooths(prev => prev.map(b => {
        if (b.id !== editingBoothId) return b;
        return {
          ...b,
          boothNumber: newBooth.boothNumber.trim(),
          name: finalName,
          sponsorType: sponsorType,
          widthM: Math.max(1, Math.min(gridWidth, parseInt(newBooth.widthM) || 1)),
          heightM: Math.max(1, Math.min(gridHeight, parseInt(newBooth.heightM) || 1)),
          color: newBooth.color,
          useTierColor: newBooth.useTierColor,
          logo: newBooth.logo
        };
      }));
      setEditingBoothId(null);
    } else {
      // Create new
      const booth = {
        id: generateId(),
        boothNumber: newBooth.boothNumber.trim(),
        name: finalName,
        sponsorType: sponsorType,
        widthM: Math.max(1, Math.min(gridWidth, parseInt(newBooth.widthM) || 1)),
        heightM: Math.max(1, Math.min(gridHeight, parseInt(newBooth.heightM) || 1)),
        color: newBooth.color,
        useTierColor: newBooth.useTierColor,
        logo: newBooth.logo,
        x: 0,
        y: 0,
        rotation: 0
      };

      // Find a non-overlapping position
      booth.x = findOpenPosition(booth, booths);

      setBooths(prev => [...prev, booth]);
      const nextColor = DEFAULT_COLORS[(colorIndex + 1) % DEFAULT_COLORS.length];
      setColorIndex(prev => prev + 1);
    }

    setNewBooth({
      boothNumber: '',
      name: '',
      widthM: 3,
      heightM: 3,
      color: DEFAULT_COLORS[0],
      useTierColor: true,
      logo: null
    });
    setIsManualExhibitor(false);
  };

  const handleEditBooth = (booth) => {
    setEditingBoothId(booth.id);
    setSelectedBoothId(booth.id);
    setNewBooth({
      boothNumber: booth.boothNumber,
      name: booth.name === 'Available' ? '' : booth.name,
      widthM: booth.widthM,
      heightM: booth.heightM,
      color: booth.color,
      useTierColor: booth.useTierColor !== undefined ? booth.useTierColor : true,
      logo: booth.logo || null
    });
    // If not in exhibitors list and not 'Available', mark as manual
    const inList = exhibitors.some(ex => ex.name === booth.name);
    setIsManualExhibitor(!inList && booth.name !== 'Available' && booth.name !== '');
    // Scroll to form
    const form = document.querySelector('.fp-add-booth-form');
    if (form) form.scrollIntoView({ behavior: 'smooth', block: 'end' });
  };

  const handleDuplicateBooth = (booth) => {
    const newId = generateId();
    const nextNumber = getNextBoothNumber(booth.boothNumber, booths);
    const duplicated = {
      ...booth,
      id: newId,
      boothNumber: nextNumber,
      x: Math.min(gridWidth - booth.widthM, booth.x + 1),
      y: Math.min(gridHeight - booth.heightM, booth.y + 1)
    };
    setBooths(prev => [...prev, duplicated]);
    setSelectedBoothId(newId);
  };

  const getNextBoothNumber = (current, all) => {
    const match = current.match(/^(.*?)(\d+)$/);
    let prefix = '';
    let num = 0;
    
    if (match) {
      prefix = match[1];
      num = parseInt(match[2]);
    } else {
      prefix = current + " ";
      num = 0;
    }

    let nextNum = num + 1;
    let candidate = `${prefix}${nextNum}`;
    
    // Safety break after 100 attempts
    let attempts = 0;
    while (all.some(b => b.boothNumber === candidate) && attempts < 100) {
      nextNum++;
      candidate = `${prefix}${nextNum}`;
      attempts++;
    }
    return candidate;
  };

  const handleCancelEdit = () => {
    setEditingBoothId(null);
    setNewBooth({
      boothNumber: '',
      name: '',
      widthM: 3,
      heightM: 3,
      color: DEFAULT_COLORS[0],
      useTierColor: true,
      logo: null
    });
    setIsManualExhibitor(false);
  };

  const handleExhibitorSelect = (e) => {
    const exhibitorName = e.target.value;
    if (exhibitorName === 'CUSTOM_OTHER') {
      setIsManualExhibitor(true);
      setNewBooth(prev => ({ ...prev, name: '', useTierColor: false }));
      return;
    }
    
    setIsManualExhibitor(false);
    const exhibitor = exhibitors.find(ex => ex.name === exhibitorName);
    if (exhibitor) {
      let color = prevBoothColor.current || newBooth.color;
      
      // If useTierColor is enabled, find the tier color
      if (newBooth.useTierColor) {
        const tier = sponsorTiers.find(t => t.label === exhibitor.sponsorType);
        if (tier) color = tier.color;
      }

      setNewBooth(prev => ({
        ...prev,
        name: exhibitor.name,
        color: color,
        logo: exhibitor.logo || null
      }));
    } else {
      setNewBooth(prev => ({ ...prev, name: exhibitorName, logo: null }));
    }
  };

  const prevBoothColor = useRef(null);

  const toggleUseTierColor = (checked) => {
    setNewBooth(prev => {
      let newColor = prev.color;
      if (checked) {
        // Find current exhibitor tier color
        const exhibitor = exhibitors.find(ex => ex.name === prev.name);
        if (exhibitor) {
          const tier = sponsorTiers.find(t => t.label === exhibitor.sponsorType);
          if (tier) {
            prevBoothColor.current = prev.color; // Save manual color
            newColor = tier.color;
          }
        }
      } else if (prevBoothColor.current) {
        newColor = prevBoothColor.current;
      }
      
      return { ...prev, useTierColor: checked, color: newColor };
    });
  };

  // Find open position for a new booth
  const findOpenPosition = (booth, existingBooths) => {
    for (let y = 0; y <= gridHeight - booth.heightM; y++) {
      for (let x = 0; x <= gridWidth - booth.widthM; x++) {
        const testBooth = { ...booth, x, y };
        if (!existingBooths.some(b => checkCollision(testBooth, b))) {
          return x;
        }
      }
    }
    return 0;
  };

  // Delete booth
  const handleDeleteBooth = (id) => {
    setBooths(prev => prev.filter(b => b.id !== id));
    if (selectedBoothId === id) setSelectedBoothId(null);
  };

  // Rotate booth
  const handleRotate = (id, direction) => {
    setBooths(prev => prev.map(b => {
      if (b.id !== id) return b;
      const newRotation = (b.rotation + (direction === 'cw' ? 90 : -90) + 360) % 360;
      // Swap width/height dimensions
      const newW = b.heightM;
      const newH = b.widthM;
      // Keep within bounds
      const maxX = gridWidth - newW;
      const maxY = gridHeight - newH;
      return {
        ...b,
        widthM: newW,
        heightM: newH,
        rotation: newRotation,
        x: Math.min(b.x, Math.max(0, maxX)),
        y: Math.min(b.y, Math.max(0, maxY))
      };
    }));
  };

  // Collision detection
  const checkCollision = (a, b) => {
    if (a.id === b.id) return false;
    return !(
      a.x + a.widthM <= b.x ||
      b.x + b.widthM <= a.x ||
      a.y + a.heightM <= b.y ||
      b.y + b.heightM <= a.y
    );
  };

  // --- Drag & Drop (pointer events for touch + mouse) ---
  const getGridCoords = useCallback((clientX, clientY) => {
    if (!gridRef.current) return { x: 0, y: 0 };
    const rect = gridRef.current.getBoundingClientRect();
    const x = (clientX - rect.left) / zoom;
    const y = (clientY - rect.top) / zoom;
    return { x, y };
  }, [zoom]);

  const handleBoothPointerDown = useCallback((e, booth) => {
    e.stopPropagation();
    e.preventDefault();
    setSelectedBoothId(booth.id);
    const coords = getGridCoords(e.clientX, e.clientY);
    setDragOffset({
      x: coords.x - booth.x * CELL_SIZE,
      y: coords.y - booth.y * CELL_SIZE
    });
    setDragging(booth.id);
  }, [getGridCoords]);

  const handlePointerMove = useCallback((e) => {
    if (dragging) {
      e.preventDefault();
      const coords = getGridCoords(e.clientX, e.clientY);
      const rawX = (coords.x - dragOffset.x) / CELL_SIZE;
      const rawY = (coords.y - dragOffset.y) / CELL_SIZE;

      setBooths(prev => prev.map(b => {
        if (b.id !== dragging) return b;
        const snappedX = Math.round(rawX);
        const snappedY = Math.round(rawY);
        const clampedX = Math.max(0, Math.min(gridWidth - b.widthM, snappedX));
        const clampedY = Math.max(0, Math.min(gridHeight - b.heightM, snappedY));
        return { ...b, x: clampedX, y: clampedY };
      }));
    } else if (isPanning && touchCount.current <= 1) {
      const dx = e.clientX - panStart.current.x;
      const dy = e.clientY - panStart.current.y;
      setPan({
        x: panStart.current.panX + dx,
        y: panStart.current.panY + dy
      });
    }
  }, [dragging, dragOffset, gridWidth, gridHeight, getGridCoords, isPanning]);

  const handlePointerUp = useCallback(() => {
    setDragging(null);
    setIsPanning(false);
  }, []);

  // Pan with middle-click or grid background drag
  const handleGridAreaPointerDown = useCallback((e) => {
    // Only start pan if clicking on the grid area background (not a booth)
    if (e.target === gridAreaRef.current || e.target.closest('.fp-grid-wrapper')) {
      if (!e.target.closest('.fp-booth')) {
        setSelectedBoothId(null);
        setIsPanning(true);
        panStart.current = {
          x: e.clientX,
          y: e.clientY,
          panX: pan.x,
          panY: pan.y
        };
      }
    }
  }, [pan]);

  useEffect(() => {
    if (!isOpen) return;
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isOpen, handlePointerMove, handlePointerUp]);

  // Zoom with mouse wheel
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

  // Pinch-to-zoom for touch
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

  const gridPxW = gridWidth * CELL_SIZE;
  const gridPxH = gridHeight * CELL_SIZE;

  // Check which booths have collisions
  const boothCollisions = {};
  booths.forEach(a => {
    booths.forEach(b => {
      if (a.id !== b.id && checkCollision(a, b)) {
        boothCollisions[a.id] = true;
        boothCollisions[b.id] = true;
      }
    });
  });

  return (
    <div className="fp-overlay" onClick={onClose}>
      <div className="fp-container" onClick={e => e.stopPropagation()}>
        {/* Top Bar */}
        <div className="fp-topbar">
          <div className="fp-topbar-left">
            <Grid3X3 size={20} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
            <h2>Floor Plan Builder</h2>
          </div>
          <div className="fp-topbar-actions">
            <button
              className="fp-btn fp-btn-primary"
              onClick={handleSave}
              disabled={saving}
            >
              <Save size={16} />
              <span className="fp-btn-label">{saving ? 'Saving...' : 'Save'}</span>
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
        ) : (
          <div className="fp-body">
            {/* Sidebar */}
            <div className={`fp-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
              {/* Grid Setup */}
              <div className="fp-sidebar-header">
                <h3>Hall Dimensions</h3>
                <div className="fp-grid-setup">
                  <div className="fp-input-group">
                    <label>Width (m)</label>
                    <input
                      type="number"
                      min={3}
                      max={200}
                      value={gridWidthInput}
                      onChange={handleGridWidthChange}
                      onBlur={handleGridWidthBlur}
                    />
                  </div>
                  <div className="fp-dimension-x">×</div>
                  <div className="fp-input-group">
                    <label>Length (m)</label>
                    <input
                      type="number"
                      min={3}
                      max={200}
                      value={gridHeightInput}
                      onChange={handleGridHeightChange}
                      onBlur={handleGridHeightBlur}
                    />
                  </div>
                </div>
              </div>

              {/* Booth List + Gate List */}
              <div className="fp-sidebar-booths">
                <div className="fp-booth-list-title">
                  <span>Booths ({booths.length})</span>
                </div>

                {booths.length === 0 && (
                  <p style={{ fontSize: '0.8rem', color: '#adb5bd', textAlign: 'center', padding: '12px 0' }}>
                    No booths yet. Add one below.
                  </p>
                )}

                {booths.map((b, index) => (
                  <div
                    key={b.id}
                    className={`fp-booth-item ${selectedBoothId === b.id ? 'active' : ''}`}
                    onClick={() => setSelectedBoothId(b.id)}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', index.toString());
                      e.currentTarget.classList.add('is-dragging-list');
                    }}
                    onDragEnd={(e) => {
                      e.currentTarget.classList.remove('is-dragging-list');
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.add('drag-over');
                    }}
                    onDragLeave={(e) => {
                      e.currentTarget.classList.remove('drag-over');
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.remove('drag-over');
                      const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
                      const toIndex = index;
                      if (fromIndex === toIndex) return;
                      
                      const updated = [...booths];
                      const [moved] = updated.splice(fromIndex, 1);
                      updated.splice(toIndex, 0, moved);
                      setBooths(updated);
                    }}
                  >
                    <div
                      className="fp-booth-color-dot"
                      style={{ background: b.color }}
                    />
                    <div className="fp-booth-item-info">
                      <div className="fp-booth-item-number">{b.boothNumber}</div>
                      <div className="fp-booth-item-name">{b.name}</div>
                    </div>
                    <div className="fp-booth-item-size">
                      {b.widthM}×{b.heightM}m
                    </div>
                    <div className="fp-booth-item-actions">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleEditBooth(b); }}
                        title="Edit Booth"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDuplicateBooth(b); }}
                        title="Duplicate Booth"
                      >
                        <Copy size={14} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleRotate(b.id, 'cw'); }}
                        title="Rotate"
                      >
                        <RotateCw size={14} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteBooth(b.id); }}
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Gates (Entrance/Exit) List */}
                {gates.length > 0 && (
                  <>
                    <div className="fp-booth-list-title" style={{ marginTop: '16px' }}>
                      <span>Entrance / Exit ({gates.length})</span>
                    </div>
                    {gates.map(g => (
                      <div key={g.id} className="fp-booth-item">
                        <div
                          className="fp-booth-color-dot"
                          style={{ background: g.type === 'entrance' ? '#10B981' : '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <DoorOpen size={14} style={{ color: '#fff' }} />
                        </div>
                        <div className="fp-booth-item-info">
                          <div className="fp-booth-item-number">{g.label}</div>
                          <div className="fp-booth-item-name">{g.type === 'entrance' ? 'Entrance' : 'Exit'} · {g.side} side</div>
                        </div>
                        <div className="fp-booth-item-size">{g.widthM}m</div>
                        <div className="fp-booth-item-actions">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteGate(g.id); }}
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>

              {/* Add Booth Form */}
              <form className="fp-add-booth-form" onSubmit={handleAddBooth}>
                <h4>
                  {editingBoothId ? <Edit2 size={14} style={{ marginRight: '6px' }} /> : <Plus size={14} style={{ marginRight: '6px' }} />}
                  {editingBoothId ? 'Update Booth' : 'Add Booth'}
                </h4>
                <div className="fp-form-row">
                  <div className="fp-input-group">
                    <label>Booth #</label>
                    <input
                      placeholder="A1"
                      value={newBooth.boothNumber}
                      onChange={e => setNewBooth(prev => ({ ...prev, boothNumber: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="fp-input-group">
                    <label>Exhibitor</label>
                    <select
                      value={isManualExhibitor ? 'CUSTOM_OTHER' : newBooth.name}
                      onChange={handleExhibitorSelect}
                    >
                      <option value="">Select Exhibitor (Optional)</option>
                      {exhibitors.map(ex => (
                        <option key={ex.id} value={ex.name}>{ex.name}</option>
                      ))}
                      <option value="CUSTOM_OTHER">-- Other / Manual --</option>
                    </select>
                    {isManualExhibitor && (
                      <input
                        placeholder="Manual Company Name"
                        style={{ marginTop: '4px' }}
                        value={newBooth.name}
                        onChange={e => setNewBooth(prev => ({ ...prev, name: e.target.value }))}
                        autoFocus
                      />
                    )}
                  </div>
                </div>
                <div className="fp-form-row">
                  <div className="fp-input-group">
                    <label>Width (m)</label>
                    <input
                      type="number"
                      min={1}
                      max={gridWidth}
                      value={newBooth.widthM}
                      onChange={e => setNewBooth(prev => ({ ...prev, widthM: parseInt(e.target.value) || 1 }))}
                    />
                  </div>
                  <div className="fp-input-group">
                    <label>Height (m)</label>
                    <input
                      type="number"
                      min={1}
                      max={gridHeight}
                      value={newBooth.heightM}
                      onChange={e => setNewBooth(prev => ({ ...prev, heightM: parseInt(e.target.value) || 1 }))}
                    />
                  </div>
                </div>
                <div className="fp-form-row-color">
                  <input
                    type="color"
                    className="fp-color-input"
                    value={newBooth.color}
                    onChange={e => {
                      setNewBooth(prev => ({ ...prev, color: e.target.value, useTierColor: false }));
                      prevBoothColor.current = e.target.value;
                    }}
                  />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontSize: '0.8rem', color: '#868e96' }}>Booth Color</span>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: '#1a1a2e', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={newBooth.useTierColor}
                        onChange={(e) => toggleUseTierColor(e.target.checked)}
                      />
                      Use Tier Color
                    </label>
                  </div>
                </div>
                <div className="fp-btn-group-row">
                  <button type="submit" className="fp-add-booth-btn">
                    {editingBoothId ? 'Update Booth' : 'Add Booth'}
                  </button>
                  {editingBoothId && (
                    <button type="button" className="fp-cancel-btn" onClick={handleCancelEdit}>
                      Cancel
                    </button>
                  )}
                </div>
              </form>

              {/* Add Entrance/Exit Form */}
              <form className="fp-add-booth-form" onSubmit={handleAddGate} style={{ borderTop: '1px solid #e5e7eb' }}>
                <h4>
                  <DoorOpen size={14} style={{ marginRight: '6px' }} />
                  Add Entrance / Exit
                </h4>
                <div className="fp-form-row">
                  <div className="fp-input-group">
                    <label>Type</label>
                    <select
                      value={newGate.type}
                      onChange={e => setNewGate(prev => ({ ...prev, type: e.target.value }))}
                    >
                      <option value="entrance">Entrance</option>
                      <option value="exit">Exit</option>
                    </select>
                  </div>
                  <div className="fp-input-group">
                    <label>Side</label>
                    <select
                      value={newGate.side}
                      onChange={e => setNewGate(prev => ({ ...prev, side: e.target.value }))}
                    >
                      <option value="top">Top</option>
                      <option value="bottom">Bottom</option>
                      <option value="left">Left</option>
                      <option value="right">Right</option>
                    </select>
                  </div>
                </div>
                <div className="fp-form-row">
                  <div className="fp-input-group">
                    <label>Position (m)</label>
                    <input
                      type="number"
                      min={0}
                      value={newGate.position}
                      onChange={e => setNewGate(prev => ({ ...prev, position: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                  <div className="fp-input-group">
                    <label>Width (m)</label>
                    <input
                      type="number"
                      min={1}
                      max={gridWidth}
                      value={newGate.widthM}
                      onChange={e => setNewGate(prev => ({ ...prev, widthM: parseInt(e.target.value) || 1 }))}
                    />
                  </div>
                </div>
                <div className="fp-form-row">
                  <div className="fp-input-group" style={{ flex: 1 }}>
                    <label>Label</label>
                    <input
                      placeholder="Main Entrance"
                      value={newGate.label}
                      onChange={e => setNewGate(prev => ({ ...prev, label: e.target.value }))}
                    />
                  </div>
                </div>
                <button type="submit" className="fp-add-booth-btn" style={{ background: '#10B981' }}>
                  <Plus size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                  Add Gate
                </button>
              </form>
            </div>

            {/* Mobile sidebar toggle */}
            <button
              className="fp-sidebar-toggle fp-btn fp-btn-secondary"
              onClick={() => setSidebarCollapsed(prev => !prev)}
            >
              {sidebarCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
              <span>{sidebarCollapsed ? 'Show Panel' : 'Hide Panel'}</span>
            </button>

            {/* Grid Area */}
            <div
              className="fp-grid-area"
              ref={gridAreaRef}
              onPointerDown={handleGridAreaPointerDown}
              style={{ touchAction: 'none' }}
            >
              <div
                className={`fp-grid-wrapper ${dragging ? 'is-dragging' : ''}`}
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                  padding: `${GATE_PADDING}px`,
                  width: `${gridPxW + GATE_PADDING * 2}px`,
                  height: `${gridPxH + GATE_PADDING * 2}px`,
                  flexShrink: 0
                }}
              >
                {/* Gate markers rendered in the padding area */}
                {gates.map(gate => {
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
                  ref={gridRef}
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

                  {/* Top meter labels */}
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

                  {/* Left meter labels */}
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
                      isSelected={selectedBoothId === booth.id}
                      isDragging={dragging === booth.id}
                      hasCollision={boothCollisions[booth.id]}
                      onPointerDown={handleBoothPointerDown}
                      onDoubleClick={setDetailBooth}
                      onRotate={handleRotate}
                    />
                  ))}
                </div>
              </div>

              {/* Zoom Controls */}
              <div className="fp-zoom-controls">
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
            </div>
          </div>
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

const Booth = memo(({ booth, isSelected, isDragging, hasCollision, onPointerDown, onDoubleClick, onRotate }) => {
  const bW = booth.widthM * CELL_SIZE;
  const bH = booth.heightM * CELL_SIZE;
  const textColor = getContrastColor(booth.color);

  return (
    <div
      className={`fp-booth fp-booth-draggable ${isSelected ? 'is-selected' : ''} ${isDragging ? 'is-dragging' : ''} ${hasCollision ? 'has-collision' : ''}`}
      style={{
        left: `${booth.x * CELL_SIZE}px`,
        top: `${booth.y * CELL_SIZE}px`,
        width: `${bW}px`,
        height: `${bH}px`,
        background: booth.color,
        color: textColor,
      }}
      onPointerDown={(e) => onPointerDown(e, booth)}
      onDoubleClick={() => onDoubleClick(booth)}
    >
      {/* Rotation controls */}
      {isSelected && (
        <div className="fp-booth-controls">
          <button
            onPointerDown={e => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onRotate(booth.id, 'cw'); }}
            title="Rotate"
          >↻</button>
        </div>
      )}
      <div className="fp-booth-number">{booth.boothNumber}</div>
      {(bW > 50 || bH > 50) && (
        <div className="fp-booth-name">{booth.name}</div>
      )}
    </div>
  );
});
