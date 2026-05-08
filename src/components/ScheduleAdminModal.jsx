import React, { useState, useEffect } from 'react';
import { X, Plus, Trash, Clock, Calendar, FileText, Layout, GripVertical, ChevronUp, ChevronDown } from 'lucide-react';
import { updateEventSchedule } from '../firebase/firestore';

export default function ScheduleAdminModal({ isOpen, onClose, event, onSaved, startDate, endDate, eventColor }) {
  const [days, setDays] = useState([]);
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [scheduleColor, setScheduleColor] = useState(eventColor || '#6D28D9');
  const [accentColor, setAccentColor] = useState('#B4A076');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (event?.scheduleSettings) {
        setScheduleColor(event.scheduleSettings.color || eventColor || '#6D28D9');
        setAccentColor(event.scheduleSettings.accent || '#B4A076');
      } else {
        setScheduleColor(eventColor || '#6D28D9');
        setAccentColor('#B4A076');
      }

      if (event?.schedule && Array.isArray(event.schedule) && event.schedule.length > 0) {
        // Migrate old format if needed
        if (!event.schedule[0].items) {
          setDays([{
            dayTitle: 'Day 1 - Highlights',
            date: event.date || '',
            items: event.schedule.map(item => ({
              time: item.time || '',
              title: item.title || '',
              description: item.description || ''
            }))
          }]);
        } else {
          setDays(JSON.parse(JSON.stringify(event.schedule)));
        }
      } else {
        // Pre-fill days based on date range
        if (startDate && endDate) {
          const prefilledDays = [];
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
          setDays(prefilledDays);
        } else {
          setDays([]);
        }
      }
    }
  }, [isOpen, event, startDate, endDate]);

  const handleAddDay = () => {
    const newDay = {
      dayTitle: `Day ${days.length + 1} - New Highlights`,
      date: '',
      items: []
    };
    setDays([...days, newDay]);
    setActiveDayIndex(days.length);
  };

  const handleDeleteDay = (index) => {
    if (!window.confirm('Are you sure you want to delete this entire day?')) return;
    const newDays = days.filter((_, i) => i !== index);
    setDays(newDays);
    if (activeDayIndex >= newDays.length) {
      setActiveDayIndex(Math.max(0, newDays.length - 1));
    }
  };

  const updateDayField = (field, value) => {
    const newDays = [...days];
    newDays[activeDayIndex][field] = value;
    setDays(newDays);
  };

  const handleAddItem = () => {
    const newDays = [...days];
    newDays[activeDayIndex].items.push({
      time: '08:00 AM',
      title: 'New Session',
      description: ''
    });
    setDays(newDays);
  };

  const handleUpdateItem = (itemIndex, field, value) => {
    const newDays = [...days];
    newDays[activeDayIndex].items[itemIndex][field] = value;
    setDays(newDays);
  };

  const handleDeleteItem = (itemIndex) => {
    const newDays = [...days];
    newDays[activeDayIndex].items = newDays[activeDayIndex].items.filter((_, i) => i !== itemIndex);
    setDays(newDays);
  };

  const handleMoveItem = (index, direction) => {
    const newDays = [...days];
    const items = newDays[activeDayIndex].items;
    if (direction === 'up' && index > 0) {
      [items[index], items[index - 1]] = [items[index - 1], items[index]];
    } else if (direction === 'down' && index < items.length - 1) {
      [items[index], items[index + 1]] = [items[index + 1], items[index]];
    }
    setDays(newDays);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateEventSchedule(event.id, event._collection || 'events', days, {
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

  const currentDay = days[activeDayIndex];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container schedule-admin-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header-refined">
          <div className="modal-header-title">
            <Calendar size={20} style={{ color: '#8B5CF6' }} />
            <h3>Manage Event Schedule</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose}><X size={24} /></button>
        </div>

        <div className="modal-body" style={{ padding: '24px 32px' }}>
          {/* Schedule Theme Settings */}
          <div className="admin-section-card" style={{ marginBottom: '24px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <div className="admin-section-header" style={{ marginBottom: '16px' }}>
              <Layout size={16} style={{ color: '#8B5CF6' }} />
              <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Schedule Theme Settings</span>
            </div>
            <div className="admin-form-row">
              <div className="form-group" style={{ flex: 1 }}>
                <label>Main Header Color</label>
                <div className="color-picker-wrapper" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input type="color" value={scheduleColor} onChange={e => setScheduleColor(e.target.value)} style={{ width: '40px', height: '40px', padding: '0', border: 'none', borderRadius: '8px', cursor: 'pointer' }} />
                  <input type="text" value={scheduleColor} onChange={e => setScheduleColor(e.target.value)} placeholder="#HEX" style={{ flex: 1 }} />
                </div>
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Date Background Color</label>
                <div className="color-picker-wrapper" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input type="color" value={accentColor} onChange={e => setAccentColor(e.target.value)} style={{ width: '40px', height: '40px', padding: '0', border: 'none', borderRadius: '8px', cursor: 'pointer' }} />
                  <input type="text" value={accentColor} onChange={e => setAccentColor(e.target.value)} placeholder="#HEX" style={{ flex: 1 }} />
                </div>
              </div>
            </div>
          </div>

          {/* Days Tab Bar */}
          <div className="admin-tabs-bar">
            {days.map((day, idx) => (
              <div key={idx} className={`admin-tab-item ${activeDayIndex === idx ? 'active' : ''}`} onClick={() => setActiveDayIndex(idx)}>
                <span>Day {idx + 1}</span>
                {days.length > 1 && (
                  <button className="admin-tab-delete" onClick={(e) => { e.stopPropagation(); handleDeleteDay(idx); }}>
                    <X size={12} />
                  </button>
                )}
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
                    value={currentDay.dayTitle} 
                    onChange={e => updateDayField('dayTitle', e.target.value)}
                    placeholder="e.g. DAY 1 - OPENING HIGHLIGHTS"
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label><Calendar size={14} /> Date</label>
                  <input 
                    value={currentDay.date} 
                    onChange={e => updateDayField('date', e.target.value)}
                    placeholder="e.g. Tuesday, May 19, 2026"
                  />
                </div>
              </div>

              <div className="admin-items-section">
                <div className="admin-items-header">
                  <label><Clock size={14} /> Schedule Items</label>
                  <button className="btn-admin-add mini" onClick={handleAddItem}>
                    <Plus size={12} /> Add Item
                  </button>
                </div>

                <div className="admin-schedule-list">
                  {currentDay.items.map((item, idx) => (
                    <div key={idx} className="admin-schedule-item-row">
                      <div className="item-order-controls">
                        <button onClick={() => handleMoveItem(idx, 'up')} disabled={idx === 0}><ChevronUp size={14} /></button>
                        <button onClick={() => handleMoveItem(idx, 'down')} disabled={idx === currentDay.items.length - 1}><ChevronDown size={14} /></button>
                      </div>
                      <div className="item-main-inputs">
                        <div className="item-top-row">
                          <input 
                            className="item-time-input"
                            value={item.time} 
                            onChange={e => handleUpdateItem(idx, 'time', e.target.value)}
                            placeholder="Time (e.g. 08:00 AM)"
                          />
                          <input 
                            className="item-title-input"
                            value={item.title} 
                            onChange={e => handleUpdateItem(idx, 'title', e.target.value)}
                            placeholder="Activity Title"
                          />
                        </div>
                        <textarea 
                          className="item-desc-input"
                          value={item.description} 
                          onChange={e => handleUpdateItem(idx, 'description', e.target.value)}
                          placeholder="Description (optional)"
                          rows={1}
                        />
                      </div>
                      <button className="item-delete-btn" onClick={() => handleDeleteItem(idx)}>
                        <Trash size={14} />
                      </button>
                    </div>
                  ))}
                  {currentDay.items.length === 0 && (
                    <div className="admin-empty-state">No items added to this day yet.</div>
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

          <div className="admin-modal-footer">
            <button className="btn-admin-save" onClick={handleSave} disabled={isSaving || days.length === 0}>
              {isSaving ? 'Saving...' : 'Save Schedule Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
