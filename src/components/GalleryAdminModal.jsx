import React, { useState, useEffect } from 'react';
import { X, Plus, Trash, Image, Video, Link, GripVertical } from 'lucide-react';
import { updateEventGallery } from '../firebase/firestore';

export default function GalleryAdminModal({ isOpen, onClose, event, onSaved }) {
  const [items, setItems] = useState([]);
  const [newUrl, setNewUrl] = useState('');
  const [newCaption, setNewCaption] = useState('');
  const [newType, setNewType] = useState('image');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen && event?.gallery) {
      setItems([...event.gallery]);
    } else if (isOpen) {
      setItems([]);
    }
  }, [isOpen, event?.gallery]);

  const handleAdd = () => {
    if (!newUrl.trim()) return;
    const item = {
      url: newUrl.trim(),
      caption: newCaption.trim(),
      type: newType,
      createdAt: new Date().toISOString()
    };
    setItems(prev => [...prev, item]);
    setNewUrl('');
    setNewCaption('');
    setNewType('image');
  };

  const handleRemove = (index) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleMoveUp = (index) => {
    if (index === 0) return;
    const copy = [...items];
    [copy[index - 1], copy[index]] = [copy[index], copy[index - 1]];
    setItems(copy);
  };

  const handleMoveDown = (index) => {
    if (index === items.length - 1) return;
    const copy = [...items];
    [copy[index], copy[index + 1]] = [copy[index + 1], copy[index]];
    setItems(copy);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateEventGallery(event.id, event._collection || 'events', items);
      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      console.error('Failed to save gallery:', err);
      alert('Failed to save gallery. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container gallery-admin-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header-refined">
          <div className="modal-header-title">
            <Image size={20} style={{ color: '#3B82F6' }} />
            <h3>Manage Gallery</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose}><X size={24} /></button>
        </div>

        <div className="modal-body" style={{ padding: '24px 32px' }}>
          {/* Add new item */}
          <div className="gallery-add-form">
            <div className="gallery-type-toggle">
              <button
                className={`type-btn ${newType === 'image' ? 'active' : ''}`}
                onClick={() => setNewType('image')}
              >
                <Image size={14} /> Image
              </button>
              <button
                className={`type-btn ${newType === 'video' ? 'active' : ''}`}
                onClick={() => setNewType('video')}
              >
                <Video size={14} /> Video
              </button>
            </div>
            <div className="gallery-url-row">
              <div style={{ position: 'relative', flex: 1 }}>
                <Link size={14} style={{ position: 'absolute', left: '12px', top: '12px', color: '#888' }} />
                <input
                  type="url"
                  placeholder={newType === 'image' ? 'Paste image URL...' : 'Paste video URL (YouTube, etc.)...'}
                  value={newUrl}
                  onChange={e => setNewUrl(e.target.value)}
                  style={{ paddingLeft: '36px', width: '100%' }}
                />
              </div>
            </div>
            <input
              type="text"
              placeholder="Caption (optional)"
              value={newCaption}
              onChange={e => setNewCaption(e.target.value)}
            />
            <button className="btn-admin-add" onClick={handleAdd} disabled={!newUrl.trim()}>
              <Plus size={14} /> Add to Gallery
            </button>
          </div>

          {/* Item list */}
          <div className="gallery-items-list">
            {items.length === 0 ? (
              <div className="gallery-empty">
                <Image size={32} style={{ color: '#ccc' }} />
                <p>No gallery items yet. Add images or videos above.</p>
              </div>
            ) : (
              items.map((item, index) => (
                <div key={index} className="gallery-item-row">
                  <div className="gallery-item-thumb">
                    {item.type === 'video' ? (
                      <div className="gallery-video-thumb"><Video size={20} /></div>
                    ) : (
                      <img src={item.url} alt={item.caption || `Gallery ${index + 1}`} />
                    )}
                  </div>
                  <div className="gallery-item-info">
                    <div className="gallery-item-url">{item.url.substring(0, 50)}...</div>
                    {item.caption && <div className="gallery-item-caption">{item.caption}</div>}
                    <span className={`gallery-type-badge ${item.type}`}>
                      {item.type === 'image' ? <Image size={10} /> : <Video size={10} />}
                      {item.type}
                    </span>
                  </div>
                  <div className="gallery-item-actions">
                    <button onClick={() => handleMoveUp(index)} disabled={index === 0} title="Move up">↑</button>
                    <button onClick={() => handleMoveDown(index)} disabled={index === items.length - 1} title="Move down">↓</button>
                    <button className="delete-btn" onClick={() => handleRemove(index)} title="Remove"><Trash size={14} /></button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <button className="btn-admin-add" onClick={handleSave} disabled={isSaving} style={{ flex: 1, background: '#3B82F6', color: 'white', justifyContent: 'center' }}>
              {isSaving ? 'Saving...' : `Save Gallery (${items.length} items)`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
