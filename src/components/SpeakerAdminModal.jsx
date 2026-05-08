import React, { useState, useEffect } from 'react';
import { X, Plus, Trash, User, Briefcase, Building, FileText, Link } from 'lucide-react';
import { updateEventSpeakers } from '../firebase/firestore';

export default function SpeakerAdminModal({ isOpen, onClose, event, onSaved }) {
  const [speakers, setSpeakers] = useState([]);
  const [formData, setFormData] = useState({
    name: '', title: '', organization: '', photo: '', bio: ''
  });
  const [editIndex, setEditIndex] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen && event?.speakers) {
      setSpeakers([...event.speakers]);
    } else if (isOpen) {
      setSpeakers([]);
    }
    setEditIndex(null);
    setFormData({ name: '', title: '', organization: '', photo: '', bio: '' });
  }, [isOpen, event?.speakers]);

  const handleAdd = () => {
    if (!formData.name.trim()) return;
    const speaker = { ...formData, createdAt: new Date().toISOString() };
    if (editIndex !== null) {
      const copy = [...speakers];
      copy[editIndex] = { ...copy[editIndex], ...speaker };
      setSpeakers(copy);
      setEditIndex(null);
    } else {
      setSpeakers(prev => [...prev, speaker]);
    }
    setFormData({ name: '', title: '', organization: '', photo: '', bio: '' });
  };

  const handleEdit = (index) => {
    const s = speakers[index];
    setFormData({ name: s.name, title: s.title || '', organization: s.organization || '', photo: s.photo || '', bio: s.bio || '' });
    setEditIndex(index);
  };

  const handleRemove = (index) => {
    setSpeakers(prev => prev.filter((_, i) => i !== index));
    if (editIndex === index) {
      setEditIndex(null);
      setFormData({ name: '', title: '', organization: '', photo: '', bio: '' });
    }
  };

  const handleMoveUp = (index) => {
    if (index === 0) return;
    const copy = [...speakers];
    [copy[index - 1], copy[index]] = [copy[index], copy[index - 1]];
    setSpeakers(copy);
  };

  const handleMoveDown = (index) => {
    if (index === speakers.length - 1) return;
    const copy = [...speakers];
    [copy[index], copy[index + 1]] = [copy[index + 1], copy[index]];
    setSpeakers(copy);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateEventSpeakers(event.id, event._collection || 'events', speakers);
      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      console.error('Failed to save speakers:', err);
      alert('Failed to save speakers. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container speaker-admin-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header-refined">
          <div className="modal-header-title">
            <User size={20} style={{ color: '#8B5CF6' }} />
            <h3>{editIndex !== null ? 'Edit Speaker' : 'Manage Speakers'}</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose}><X size={24} /></button>
        </div>

        <div className="modal-body" style={{ padding: '24px 32px' }}>
          {/* Add / Edit form */}
          <div className="speaker-add-form">
            <div className="speaker-form-grid">
              <div className="form-group">
                <label><User size={14} /> Name *</label>
                <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Speaker name" />
              </div>
              <div className="form-group">
                <label><Briefcase size={14} /> Title / Role</label>
                <input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. CEO, Keynote Speaker" />
              </div>
              <div className="form-group">
                <label><Building size={14} /> Organization</label>
                <input value={formData.organization} onChange={e => setFormData({...formData, organization: e.target.value})} placeholder="Company or institution" />
              </div>
              <div className="form-group">
                <label><Link size={14} /> Photo URL</label>
                <input value={formData.photo} onChange={e => setFormData({...formData, photo: e.target.value})} placeholder="https://..." />
              </div>
            </div>
            <div className="form-group">
              <label><FileText size={14} /> Short Bio</label>
              <textarea value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} placeholder="Brief speaker bio..." rows={3} />
            </div>
            <button className="btn-admin-add" onClick={handleAdd} disabled={!formData.name.trim()} style={{ background: '#8B5CF6', color: 'white' }}>
              <Plus size={14} /> {editIndex !== null ? 'Update Speaker' : 'Add Speaker'}
            </button>
            {editIndex !== null && (
              <button className="btn-admin-add" onClick={() => { setEditIndex(null); setFormData({ name: '', title: '', organization: '', photo: '', bio: '' }); }} style={{ background: '#f1f5f9', color: '#64748b' }}>
                Cancel Edit
              </button>
            )}
          </div>

          {/* Speaker list */}
          <div className="speaker-items-list">
            {speakers.length === 0 ? (
              <div className="gallery-empty">
                <User size={32} style={{ color: '#ccc' }} />
                <p>No speakers yet. Add your first speaker above.</p>
              </div>
            ) : (
              speakers.map((speaker, index) => (
                <div key={index} className="speaker-item-row">
                  <div className="speaker-item-photo">
                    {speaker.photo ? (
                      <img src={speaker.photo} alt={speaker.name} />
                    ) : (
                      <div className="speaker-photo-placeholder"><User size={20} /></div>
                    )}
                  </div>
                  <div className="speaker-item-info" onClick={() => handleEdit(index)} style={{ cursor: 'pointer' }}>
                    <div className="speaker-item-name">{speaker.name}</div>
                    <div className="speaker-item-role">{speaker.title}{speaker.organization ? ` · ${speaker.organization}` : ''}</div>
                  </div>
                  <div className="gallery-item-actions">
                    <button onClick={() => handleMoveUp(index)} disabled={index === 0}>↑</button>
                    <button onClick={() => handleMoveDown(index)} disabled={index === speakers.length - 1}>↓</button>
                    <button className="delete-btn" onClick={() => handleRemove(index)}><Trash size={14} /></button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <button className="btn-admin-add" onClick={handleSave} disabled={isSaving} style={{ flex: 1, background: '#8B5CF6', color: 'white', justifyContent: 'center' }}>
              {isSaving ? 'Saving...' : `Save Speakers (${speakers.length})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
