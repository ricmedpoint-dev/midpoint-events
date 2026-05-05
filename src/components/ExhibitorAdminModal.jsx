import { useState, useEffect } from 'react';
import { X, Upload, Globe, MapPin, Save, Trash2 } from 'lucide-react';
import { addExhibitor, updateExhibitor, deleteExhibitor } from '../firebase/firestore';

export const SPONSOR_TYPES = [
  'Main Sponsor',
  'Strategic Partner/s',
  'Platinum Sponsor/s',
  'Gold Sponsor/s',
  'Silver Sponsor/s',
  'Bronze Sponsor/s',
  'Participations',
  'Others (Please specify)'
];

export default function ExhibitorAdminModal({ isOpen, onClose, eventId, exhibitor = null, onSaved, sponsorTiers = null }) {
  const [formData, setFormData] = useState({
    name: '',
    sponsorType: sponsorTiers?.[0]?.label || 'Participations',
    otherSponsorType: '',
    logo: '',
    image: '',
    country: '',
    website: '',
    description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (exhibitor) {
      setFormData({
        name: exhibitor.name || '',
        sponsorType: exhibitor.sponsorType || 'Participations',
        otherSponsorType: exhibitor.otherSponsorType || '',
        logo: exhibitor.logo || '',
        image: exhibitor.image || '',
        country: exhibitor.country || '',
        website: exhibitor.website || '',
        description: exhibitor.description || ''
      });
    } else {
      setFormData({
        name: '',
        sponsorType: 'Participations',
        otherSponsorType: '',
        logo: '',
        image: '',
        country: '',
        website: '',
        description: ''
      });
    }
  }, [exhibitor, isOpen]);

  if (!isOpen) return null;

  const trimCanvas = (canvas) => {
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    let minX = width, minY = height, maxX = 0, maxY = 0;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const index = (y * width + x) * 4;
        const r = data[index], g = data[index + 1], b = data[index + 2], a = data[index + 3];
        
        // If not transparent and not pure white
        const isTransparent = a < 10;
        const isWhite = r > 250 && g > 250 && b > 250;
        
        if (!isTransparent && !isWhite) {
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
        }
      }
    }

    if (maxX < minX || maxY < minY) return canvas;

    // Add a small padding (5%)
    const padding = Math.round((maxX - minX) * 0.05);
    minX = Math.max(0, minX - padding);
    minY = Math.max(0, minY - padding);
    maxX = Math.min(width - 1, maxX + padding);
    maxY = Math.min(height - 1, maxY + padding);

    const trimmedWidth = maxX - minX + 1;
    const trimmedHeight = maxY - minY + 1;
    const trimmedCanvas = document.createElement('canvas');
    trimmedCanvas.width = trimmedWidth;
    trimmedCanvas.height = trimmedHeight;
    trimmedCanvas.getContext('2d').drawImage(canvas, minX, minY, trimmedWidth, trimmedHeight, 0, 0, trimmedWidth, trimmedHeight);
    return trimmedCanvas;
  };

  const compressImage = (file, maxWidth = 800, isLogo = false) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target.result;
        img.onload = () => {
          let canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);

          // Auto-trim logos to remove excess white space
          if (isLogo) {
            canvas = trimCanvas(canvas);
          }

          let width = canvas.width;
          let height = canvas.height;
          
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }

          const isTransparent = file.type === 'image/png' || file.type === 'image/svg+xml';
          const outputType = isTransparent ? 'image/png' : 'image/jpeg';
          
          const process = (w, h, q) => {
            const outCanvas = document.createElement('canvas');
            outCanvas.width = w;
            outCanvas.height = h;
            const outCtx = outCanvas.getContext('2d');
            outCtx.clearRect(0, 0, w, h);
            outCtx.drawImage(canvas, 0, 0, w, h);
            return outCanvas.toDataURL(outputType, q);
          };

          let quality = isTransparent ? 1.0 : 0.7;
          let dataUrl = process(width, height, quality);
          
          const MAX_BASE64_LENGTH = 900000;
          let attempts = 0;
          while (dataUrl.length > MAX_BASE64_LENGTH && attempts < 6) {
            attempts++;
            width *= 0.8;
            height *= 0.8;
            if (!isTransparent) quality = Math.max(0.2, quality - 0.1);
            dataUrl = process(width, height, quality);
          }
          
          resolve(dataUrl);
        };
      };
    });
  };

  const handleFileUpload = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;
    const isLogo = field === 'logo';
    const base64 = await compressImage(file, isLogo ? 400 : 1000, isLogo);
    setFormData(prev => ({ ...prev, [field]: base64 }));
  };

  const handlePaste = async (e, field) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        const isLogo = field === 'logo';
        const base64 = await compressImage(file, isLogo ? 400 : 1000, isLogo);
        setFormData(prev => ({ ...prev, [field]: base64 }));
        break;
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.logo) return alert("Logo is required");
    setIsSubmitting(true);
    try {
      const data = { ...formData, eventId };
      if (exhibitor?.id) {
        await updateExhibitor(exhibitor.id, data);
      } else {
        await addExhibitor(data);
      }
      onSaved();
      onClose();
    } catch (err) {
      alert("Failed to save exhibitor: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this exhibitor?")) return;
    setIsSubmitting(true);
    try {
      await deleteExhibitor(exhibitor.id);
      onSaved();
      onClose();
    } catch (err) {
      alert("Delete failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="exhibitor-modal-overlay" onClick={onClose}>
      <div className="exhibitor-modal-container" onClick={e => e.stopPropagation()}>
        <button className="close-modal-btn" onClick={onClose}><X size={20} /></button>
        
        <form className="exhibitor-form" onSubmit={handleSubmit}>
          <h3 style={{ marginBottom: '20px', color: 'var(--color-primary)' }}>
            {exhibitor ? 'Edit Exhibitor' : 'Add New Exhibitor'}
          </h3>

          <div className="form-group">
            <label>Exhibitor Name *</label>
            <input 
              required 
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})} 
              placeholder="Company Name"
            />
          </div>

          <div className="form-group">
            <label>Sponsor Type</label>
            <select 
              value={formData.sponsorType} 
              onChange={e => setFormData({...formData, sponsorType: e.target.value})}
            >
              {(sponsorTiers || SPONSOR_TYPES.map(t => ({ label: t }))).map(tier => (
                <option key={tier.id || tier.label} value={tier.label}>{tier.label}</option>
              ))}
            </select>
          </div>

          {formData.sponsorType === 'Others (Please specify)' && (
            <div className="form-group">
              <label>Specify Sponsor Type *</label>
              <input 
                required 
                value={formData.otherSponsorType} 
                onChange={e => setFormData({...formData, otherSponsorType: e.target.value})} 
                placeholder="e.g., Media Partner"
              />
            </div>
          )}

          <div className="admin-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div className="form-group">
              <label>Logo (1:1 recommended) *</label>
              <label 
                className="file-input-wrapper" 
                onPaste={e => handlePaste(e, 'logo')}
                tabIndex="0"
                style={{ outline: 'none' }}
              >
                <Upload size={18} style={{ marginBottom: '5px' }} />
                <span style={{ display: 'block', fontSize: '0.8rem' }}>Upload or Paste Logo</span>
                <input type="file" accept="image/*" onChange={e => handleFileUpload(e, 'logo')} hidden />
                {formData.logo && <img src={formData.logo} className="preview-img" alt="Logo preview" />}
              </label>
            </div>
            <div className="form-group">
              <label>Cover Image (Optional)</label>
              <label 
                className="file-input-wrapper" 
                onPaste={e => handlePaste(e, 'image')}
                tabIndex="0"
                style={{ outline: 'none' }}
              >
                <Upload size={18} style={{ marginBottom: '5px' }} />
                <span style={{ display: 'block', fontSize: '0.8rem' }}>Upload or Paste Cover</span>
                <input type="file" accept="image/*" onChange={e => handleFileUpload(e, 'image')} hidden />
                {formData.image && <img src={formData.image} className="preview-img" alt="Cover preview" />}
              </label>
            </div>
          </div>

          <div className="admin-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div className="form-group">
              <label>Country</label>
              <div style={{ position: 'relative' }}>
                <MapPin size={16} style={{ position: 'absolute', left: '10px', top: '14px', color: '#888' }} />
                <input 
                  style={{ paddingLeft: '35px' }}
                  value={formData.country} 
                  onChange={e => setFormData({...formData, country: e.target.value})} 
                  placeholder="UAE, USA, etc."
                />
              </div>
            </div>
            <div className="form-group">
              <label>Website URL</label>
              <div style={{ position: 'relative' }}>
                <Globe size={16} style={{ position: 'absolute', left: '10px', top: '14px', color: '#888' }} />
                <input 
                  style={{ paddingLeft: '35px' }}
                  type="url"
                  value={formData.website} 
                  onChange={e => setFormData({...formData, website: e.target.value})} 
                  placeholder="https://..."
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea 
              rows={3}
              value={formData.description} 
              onChange={e => setFormData({...formData, description: e.target.value})} 
              placeholder="Short bio or company profile..."
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            {exhibitor && (
              <button 
                type="button" 
                className="btn-delete" 
                onClick={handleDelete}
                style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fee2e2', padding: '12px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                disabled={isSubmitting}
              >
                <Trash2 size={18} />
              </button>
            )}
            <button 
              type="submit" 
              className="btn-visit-site" 
              style={{ flex: 1, border: 'none', cursor: 'pointer' }}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : (exhibitor ? 'Update Exhibitor' : 'Add Exhibitor')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
