import React, { useState, useEffect } from 'react';
import { X, Plus, Trash, Clock, Calendar, FileText, Layout, GripVertical, ChevronUp, ChevronDown } from 'lucide-react';
import { updateEventSchedule } from '../firebase/firestore';

export default function ScheduleAdminModal({ isOpen, onClose, event, onSaved, startDate, endDate, eventColor }) {
  const [tracks, setTracks] = useState({ 'Exhibition': { days: [], color: eventColor || '#E31E24' } });
  const [activeTrack, setActiveTrack] = useState('Exhibition');
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [scheduleColor, setScheduleColor] = useState(eventColor || '#6D28D9');
  const [accentColor, setAccentColor] = useState('#B4A076');
  const [isSaving, setIsSaving] = useState(false);
  const [editingTrackName, setEditingTrackName] = useState(null);
  const [newTrackName, setNewTrackName] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (event?.scheduleSettings) {
        setScheduleColor(event.scheduleSettings.color || eventColor || '#6D28D9');
        setAccentColor(event.scheduleSettings.accent || '#B4A076');
      } else {
        setScheduleColor(eventColor || '#6D28D9');
        setAccentColor('#B4A076');
      }

      if (event?.schedule) {
        if (Array.isArray(event.schedule)) {
          // Migrate old format: Array of days -> { Exhibition: { days: [days], color } }
          let migratedDays = [];
          if (event.schedule.length > 0) {
            if (!event.schedule[0].items) {
              migratedDays = [{
                dayTitle: 'Day 1 - Highlights',
                date: event.date || '',
                items: event.schedule.map(item => ({
                  time: item.time || '',
                  title: item.title || '',
                  description: item.description || '',
                  speaker: '', topic: '', university: ''
                }))
              }];
            } else {
              migratedDays = JSON.parse(JSON.stringify(event.schedule));
            }
          }
          setTracks({ 'Exhibition': { days: migratedDays, color: event?.scheduleSettings?.color || eventColor || '#E31E24' } });
          setActiveTrack('Exhibition');
        } else {
          // New format: Object with tracks
          const loadedTracks = JSON.parse(JSON.stringify(event.schedule));
          // Ensure all tracks have the new structure
          const formattedTracks = {};
          Object.entries(loadedTracks).forEach(([name, data]) => {
            if (Array.isArray(data)) {
              formattedTracks[name] = { days: data, color: eventColor || '#E31E24' };
            } else {
              formattedTracks[name] = data;
            }
          });
          setTracks(formattedTracks);
          const firstTrack = Object.keys(formattedTracks)[0] || 'Exhibition';
          setActiveTrack(firstTrack);
        }
      } else {
        // Pre-fill default track based on date range
        const prefilledDays = [];
        if (startDate && endDate) {
          const start = new Date(startDate);
          const end = new Date(endDate);
          let current = new Date(start);
          let dayCount = 1;
          while (current <= end) {
            prefilledDays.push({
              dayTitle: `DAY ${dayCount} - HIGHLIGHTS`,
              date: current.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }),
              items: []
            });
            current.setDate(current.getDate() + 1);
            dayCount++;
            if (dayCount > 14) break; 
          }
        }
        setTracks({ 'Exhibition': { days: prefilledDays, color: eventColor || '#E31E24' } });
        setActiveTrack('Exhibition');
      }
    }
  }, [isOpen, event, startDate, endDate]);

  const days = tracks[activeTrack]?.days || [];

  const handleAddDay = () => {
    const newDay = {
      dayTitle: `Day ${days.length + 1} - New Highlights`,
      date: '',
      items: []
    };
    setTracks(prev => ({
      ...prev,
      [activeTrack]: { 
        ...prev[activeTrack], 
        days: [...(prev[activeTrack]?.days || []), newDay] 
      }
    }));
    setActiveDayIndex(days.length);
  };

  const handleDeleteDay = (index) => {
    if (!window.confirm('Are you sure you want to delete this entire day?')) return;
    const newDays = days.filter((_, i) => i !== index);
    setTracks(prev => ({
      ...prev,
      [activeTrack]: { ...prev[activeTrack], days: newDays }
    }));
    if (activeDayIndex >= newDays.length) {
      setActiveDayIndex(Math.max(0, newDays.length - 1));
    }
  };

  const updateDayField = (field, value) => {
    const newDays = [...days];
    newDays[activeDayIndex][field] = value;
    setTracks(prev => ({
      ...prev,
      [activeTrack]: { ...prev[activeTrack], days: newDays }
    }));
  };

  const handleAddItem = () => {
    const newDays = [...days];
    newDays[activeDayIndex].items.push({
      time: '08:00 AM',
      title: 'New Session',
      description: '',
      speaker: '',
      topic: '',
      university: ''
    });
    setTracks(prev => ({
      ...prev,
      [activeTrack]: { ...prev[activeTrack], days: newDays }
    }));
  };

  const handleUpdateItem = (itemIndex, field, value) => {
    const newDays = [...days];
    newDays[activeDayIndex].items[itemIndex][field] = value;
    setTracks(prev => ({
      ...prev,
      [activeTrack]: { ...prev[activeTrack], days: newDays }
    }));
  };

  const handleDeleteItem = (itemIndex) => {
    const newDays = [...days];
    newDays[activeDayIndex].items = newDays[activeDayIndex].items.filter((_, i) => i !== itemIndex);
    setTracks(prev => ({
      ...prev,
      [activeTrack]: { ...prev[activeTrack], days: newDays }
    }));
  };

  const handleMoveItem = (index, direction) => {
    const newDays = [...days];
    const items = newDays[activeDayIndex].items;
    if (direction === 'up' && index > 0) {
      [items[index], items[index - 1]] = [items[index - 1], items[index]];
    } else if (direction === 'down' && index < items.length - 1) {
      [items[index], items[index + 1]] = [items[index + 1], items[index]];
    }
    setTracks(prev => ({
      ...prev,
      [activeTrack]: { ...prev[activeTrack], days: newDays }
    }));
  };

  const handleAddTrack = () => {
    const name = window.prompt('Enter track name (e.g. Seminars, Workshops):');
    if (name && name.trim() && !tracks[name.trim()]) {
      setTracks(prev => ({
        ...prev,
        [name.trim()]: { days: [], color: eventColor || '#E31E24' }
      }));
      setActiveTrack(name.trim());
      setActiveDayIndex(0);
    }
  };

  const handleRenameTrack = (oldName) => {
    const newName = window.prompt('Rename track to:', oldName);
    if (newName && newName.trim() && newName !== oldName) {
      const newTracks = { ...tracks };
      newTracks[newName.trim()] = newTracks[oldName];
      delete newTracks[oldName];
      setTracks(newTracks);
      setActiveTrack(newName.trim());
    }
  };

  const updateTrackColor = (name, color) => {
    setTracks(prev => ({
      ...prev,
      [name]: { ...prev[name], color }
    }));
  };

  const handleDeleteTrack = (name) => {
    if (Object.keys(tracks).length <= 1) {
      alert('You must have at least one track.');
      return;
    }
    if (!window.confirm(`Are you sure you want to delete the entire "${name}" track?`)) return;
    const newTracks = { ...tracks };
    delete newTracks[name];
    setTracks(newTracks);
    const firstTrack = Object.keys(newTracks)[0];
    setActiveTrack(firstTrack);
    setActiveDayIndex(0);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateEventSchedule(event.id, event._collection || 'events', tracks, {
        color: scheduleColor,
        accent: accentColor
      });
      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      console.error('Failed to save schedule:', err);
      alert('Failed to save schedule. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-container schedule-admin-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header-refined">
          <div className="modal-header-title">
            <Calendar size={20} style={{ color: '#8B5CF6' }} />
            <h3>Manage Event Schedule</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose}><X size={24} /></button>
        </div>

        <div className="modal-body" style={{ padding: '24px 32px' }}>
          {/* Tracks Management */}
          <div className="admin-section-header" style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px', 
            marginBottom: '20px',
            paddingBottom: '12px',
            borderBottom: '1px solid #f1f5f9'
          }}>
            <FileText size={20} style={{ color: 'var(--color-primary)' }} />
            <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#1e293b' }}>Manage Schedule Tracks</span>
          </div>

          {/* Tracks Selector */}
          <div className="admin-tabs-bar tracks-bar" style={{ 
            background: '#f8fafc', 
            padding: '12px', 
            borderRadius: '16px', 
            marginBottom: '32px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: '12px',
            border: '1px solid #e2e8f0'
          }}>
            {Object.keys(tracks).map((trackName) => (
              <div 
                key={trackName} 
                className={`admin-tab-item ${activeTrack === trackName ? 'active' : ''}`} 
                onClick={() => { setActiveTrack(trackName); setActiveDayIndex(0); }}
                style={{ 
                  background: activeTrack === trackName ? '#fff' : '#f1f5f9',
                  border: `2px solid ${activeTrack === trackName ? 'var(--color-primary)' : 'transparent'}`,
                  boxShadow: activeTrack === trackName ? '0 4px 12px rgba(0,0,0,0.08)' : 'none',
                  borderRadius: '12px',
                  padding: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                  <span style={{ 
                    fontWeight: 800, 
                    fontSize: '0.9rem', 
                    color: activeTrack === trackName ? '#1e293b' : '#64748b',
                    lineHeight: '1.2',
                    wordBreak: 'break-word'
                  }}>
                    {trackName}
                  </span>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button className="admin-tab-delete" title="Rename" onClick={(e) => { e.stopPropagation(); handleRenameTrack(trackName); }} style={{ color: '#94a3b8', padding: '2px' }}>
                      <Layout size={14} />
                    </button>
                    {Object.keys(tracks).length > 1 && (
                      <button className="admin-tab-delete" title="Delete Track" onClick={(e) => { e.stopPropagation(); handleDeleteTrack(trackName); }} style={{ color: '#f43f5e', padding: '2px' }}>
                        <Trash size={14} />
                      </button>
                    )}
                  </div>
                </div>
                
                <div style={{ 
                  marginTop: 'auto',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  paddingTop: '8px',
                  borderTop: '1px solid #e2e8f0'
                }} onClick={e => e.stopPropagation()}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#94a3b8' }}>Theme Color</span>
                  <input 
                    type="color" 
                    value={tracks[trackName].color || eventColor} 
                    onChange={e => updateTrackColor(trackName, e.target.value)} 
                    style={{ 
                      width: '20px', 
                      height: '20px', 
                      border: '2px solid #fff', 
                      padding: 0, 
                      borderRadius: '4px',
                      cursor: 'pointer',
                      boxShadow: '0 0 0 1px #e2e8f0'
                    }} 
                  />
                </div>
              </div>
            ))}
            
            <button 
              className="admin-add-tab-btn" 
              onClick={handleAddTrack} 
              style={{ 
                background: '#fff', 
                color: 'var(--color-primary)', 
                border: '2px dashed #cbd5e1',
                borderRadius: '12px',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                height: '100%',
                minHeight: '85px',
                transition: 'all 0.2s ease',
                cursor: 'pointer'
              }}
              onMouseOver={e => e.currentTarget.style.borderColor = 'var(--color-primary)'}
              onMouseOut={e => e.currentTarget.style.borderColor = '#cbd5e1'}
            >
              <Plus size={20} />
              <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>Add New Track</span>
            </button>
          </div>

          <div className="admin-section-header" style={{ marginBottom: '12px', marginTop: '24px' }}>
            <Calendar size={16} style={{ color: 'var(--color-primary)' }} />
            <span style={{ fontWeight: 700, fontSize: '1rem' }}>Days for {activeTrack}</span>
          </div>
          <div className="admin-tabs-bar">
            {days.map((day, idx) => (
              <div key={idx} className={`admin-tab-item ${activeDayIndex === idx ? 'active' : ''}`} onClick={() => setActiveDayIndex(idx)}>
                <span>Day {idx + 1}</span>
                <button className="admin-tab-delete" onClick={(e) => { e.stopPropagation(); handleDeleteDay(idx); }}>
                  <X size={12} />
                </button>
              </div>
            ))}
            <button className="admin-add-tab-btn" onClick={handleAddDay}>
              <Plus size={14} /> Add Day
            </button>
          </div>

          {days.length > 0 ? (
            <div className="admin-day-content">
              <div className="admin-form-row">
                <div className="form-group" style={{ flex: 2 }}>
                  <label><Layout size={14} /> Day Title</label>
                  <input 
                    value={days[activeDayIndex]?.dayTitle || ''} 
                    onChange={e => updateDayField('dayTitle', e.target.value)}
                    placeholder="e.g. DAY 1 - OPENING HIGHLIGHTS"
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label><Calendar size={14} /> Date</label>
                  <input 
                    value={days[activeDayIndex]?.date || ''} 
                    onChange={e => updateDayField('date', e.target.value)}
                    placeholder="e.g. Tuesday, May 19, 2026"
                  />
                </div>
              </div>

              <div className="admin-items-section" style={{ marginTop: '32px' }}>
                <div className="admin-items-header" style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  marginBottom: '16px',
                  paddingBottom: '12px',
                  borderBottom: '1px solid #f1f5f9'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Clock size={20} style={{ color: 'var(--color-primary)' }} />
                    <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#1e293b' }}>Schedule Items</span>
                  </div>
                  <button 
                    className="admin-add-tab-btn" 
                    onClick={handleAddItem} 
                    style={{ 
                      background: 'var(--color-primary)', 
                      color: '#fff', 
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px 16px',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                  >
                    <Plus size={16} /> Add Session
                  </button>
                </div>

                <div className="admin-schedule-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {(days[activeDayIndex]?.items || []).map((item, idx) => (
                    <div key={idx} className="admin-schedule-item-card" style={{ 
                      background: '#fff', 
                      border: '1px solid #e2e8f0', 
                      borderRadius: '16px', 
                      padding: '20px',
                      position: 'relative',
                      display: 'flex',
                      gap: '20px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                    }}>
                      {/* Order Controls */}
                      <div className="item-order-column" style={{ display: 'flex', flexDirection: 'column', gap: '4px', justifyContent: 'center' }}>
                        <button 
                          onClick={() => handleMoveItem(idx, 'up')} 
                          disabled={idx === 0}
                          style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '4px', cursor: idx === 0 ? 'not-allowed' : 'pointer', color: idx === 0 ? '#cbd5e1' : '#64748b' }}
                        >
                          <ChevronUp size={16} />
                        </button>
                        <button 
                          onClick={() => handleMoveItem(idx, 'down')} 
                          disabled={idx === (days[activeDayIndex]?.items?.length - 1)}
                          style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '4px', cursor: idx === (days[activeDayIndex]?.items?.length - 1) ? 'not-allowed' : 'pointer', color: idx === (days[activeDayIndex]?.items?.length - 1) ? '#cbd5e1' : '#64748b' }}
                        >
                          <ChevronDown size={16} />
                        </button>
                      </div>

                      <div className="item-main-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {/* Row 1: Time & Title */}
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <div style={{ width: '180px' }}>
                            <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>Time / Range</label>
                            <input 
                              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', fontWeight: 700 }}
                              value={item.time} 
                              onChange={e => handleUpdateItem(idx, 'time', e.target.value)}
                              placeholder="e.g. 09:30 AM"
                            />
                          </div>
                          <div style={{ flex: 1 }}>
                            <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>Session Title</label>
                            <input 
                              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', fontWeight: 700 }}
                              value={item.title} 
                              onChange={e => handleUpdateItem(idx, 'title', e.target.value)}
                              placeholder="Session Name"
                            />
                          </div>
                        </div>

                        {/* Row 2: Description */}
                        <div>
                          <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>Description</label>
                          <textarea 
                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', minHeight: '60px', resize: 'vertical' }}
                            value={item.description} 
                            onChange={e => handleUpdateItem(idx, 'description', e.target.value)}
                            placeholder="Add details about this session..."
                          />
                        </div>

                        {/* Row 3: Seminar Info */}
                        <div style={{ 
                          display: 'grid', 
                          gridTemplateColumns: '1fr 1fr 1fr', 
                          gap: '12px',
                          padding: '12px',
                          background: '#f8fafc',
                          borderRadius: '12px',
                          border: '1px solid #edf2f7'
                        }}>
                          <div>
                            <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>Speaker</label>
                            <input 
                              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
                              value={item.speaker || ''} 
                              onChange={e => handleUpdateItem(idx, 'speaker', e.target.value)}
                              placeholder="Name"
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>Topic</label>
                            <input 
                              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
                              value={item.topic || ''} 
                              onChange={e => handleUpdateItem(idx, 'topic', e.target.value)}
                              placeholder="Subject"
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>Institution</label>
                            <input 
                              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
                              value={item.university || ''} 
                              onChange={e => handleUpdateItem(idx, 'university', e.target.value)}
                              placeholder="University"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Delete Button */}
                      <button 
                        onClick={() => handleDeleteItem(idx)}
                        style={{ 
                          position: 'absolute', 
                          top: '12px', 
                          right: '12px', 
                          color: '#f43f5e', 
                          background: 'none', 
                          border: 'none', 
                          cursor: 'pointer',
                          padding: '4px',
                          borderRadius: '50%'
                        }}
                        onMouseOver={e => e.currentTarget.style.background = '#fff1f2'}
                        onMouseOut={e => e.currentTarget.style.background = 'none'}
                      >
                        <Trash size={18} />
                      </button>
                    </div>
                  ))}
                  {(!days[activeDayIndex] || days[activeDayIndex].items.length === 0) && (
                    <div className="admin-empty-state" style={{ 
                      padding: '48px', 
                      textAlign: 'center', 
                      background: '#f8fafc', 
                      borderRadius: '16px', 
                      border: '2px dashed #e2e8f0',
                      color: '#94a3b8',
                      fontWeight: 600
                    }}>
                      No sessions added for this day. Click "+ Add Session" to get started.
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="admin-empty-state" style={{ padding: '40px' }}>
              <p>No days added to the schedule.</p>
              <button className="btn-admin-add" onClick={handleAddDay}>
                <Plus size={14} /> Create First Day
              </button>
            </div>
          )}

          <div className="modal-footer" style={{ 
            padding: '24px 32px', 
            borderTop: '1px solid #f1f5f9', 
            display: 'flex', 
            justifyContent: 'flex-end', 
            gap: '12px',
            background: '#f8fafc',
            marginTop: '32px'
          }}>
            <button className="admin-cancel-btn" onClick={onClose} style={{ 
              padding: '12px 24px', 
              borderRadius: '10px', 
              border: '1px solid #e2e8f0',
              background: '#fff',
              fontWeight: 700,
              color: '#64748b',
              cursor: 'pointer'
            }}>
              Cancel
            </button>
            <button className="admin-save-btn" onClick={handleSave} disabled={isSaving || days.length === 0} style={{ 
              padding: '12px 32px', 
              borderRadius: '10px', 
              border: 'none',
              background: 'var(--color-primary)',
              color: '#fff',
              fontWeight: 800,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              cursor: 'pointer',
              opacity: (isSaving || days.length === 0) ? 0.6 : 1
            }}>
              {isSaving ? 'Saving...' : 'Save Schedule Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
