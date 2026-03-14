import { useNavigate } from 'react-router-dom';
import { Shield, ArrowLeft, Plus, Trash2, Link as LinkIcon, Upload, X, Save, Image as ImageIcon, Video, Edit2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getBanners, addBanner, deleteBanner, updateBanner } from '../firebase/firestore';
import { useAuth } from '../context/AuthContext';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddBanner, setShowAddBanner] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const { isAdmin } = useAuth();

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    startDate: '', // Store for the picker
    endDate: '',   // Store for the picker
    location: '',
    description: '',
    eventColor: '#E31E24',
    order: 1,
    language: 'English / Arabic',
    mediaUrl: '',
    mediaType: 'image'
  });
  const [autoFormat, setAutoFormat] = useState(true);

  // Date Formatting Logic
  const formatDateRange = (startStr, endStr) => {
    if (!startStr) return '';
    const start = new Date(startStr);
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
    const startDay = start.getDate();
    const startMonth = months[start.getMonth()];
    const startYear = start.getFullYear();

    if (!endStr || startStr === endStr) {
      return `${startMonth} ${startDay}, ${startYear}`;
    }

    const end = new Date(endStr);
    const endDay = end.getDate();
    const endMonth = months[end.getMonth()];
    const endYear = end.getFullYear();

    if (startMonth === endMonth && startYear === endYear) {
      return `${startDay} - ${endDay} ${startMonth} ${startYear}`;
    }

    if (startYear === endYear) {
      return `${startDay} ${startMonth} - ${endDay} ${endMonth} ${startYear}`;
    }

    return `${startDay} ${startMonth} ${startYear} - ${endDay} ${endMonth} ${endYear}`;
  };

  useEffect(() => {
    if (autoFormat && (formData.startDate || formData.endDate)) {
      const formatted = formatDateRange(formData.startDate, formData.endDate);
      setFormData(prev => ({ ...prev, date: formatted }));
    }
  }, [formData.startDate, formData.endDate, autoFormat]);

  useEffect(() => {
    fetchBanners();
  }, []);

  async function fetchBanners() {
    try {
      const data = await getBanners();
      setBanners(data);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }

  // Security guard - redirect if not admin (though ProtectedRoute handles this)
  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate('/');
    }
  }, [isAdmin, loading, navigate]);

  const compressImage = (file, maxWidth = 1200, maxHeight = 1200, quality = 0.6) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height *= maxWidth / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width *= maxHeight / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          const base64 = canvas.toDataURL('image/jpeg', quality);
          resolve(base64);
        };
      };
      reader.onerror = reject;
    });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('File is too big. Please use a URL link for files over 5MB.');
      return;
    }

    try {
      const base64 = await compressImage(file);
      // Check if result is under 1MB for Firestore
      if (base64.length > 1000000) {
        alert('Compressed image still exceeds 1MB. Please use an external URL link for high-resolution images.');
        return;
      }
      setFormData({ ...formData, mediaUrl: base64, mediaType: 'image' });
    } catch (err) {
      alert('Upload failed: ' + err.message);
    }
  };

  const transformGoogleDriveUrl = (url) => {
    if (!url) return '';
    // Handle standard "share" links: /file/d/FILE_ID/view
    const fileDMatch = url.match(/drive\.google\.com\/file\/d\/([^\/\?\&]+)/);
    // Handle "open?id=" links: /open?id=FILE_ID
    const openIdMatch = url.match(/id=([^\/\?\&]+)/);
    
    const fileId = (fileDMatch && fileDMatch[1]) || (openIdMatch && openIdMatch[1]);
    
    if (fileId && (url.includes('drive.google.com') || url.includes('docs.google.com'))) {
      // The "lh3.googleusercontent.com/d/ID" is a highly reliable direct image link format
      return `https://lh3.googleusercontent.com/d/${fileId}`;
    }
    return url;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Transform Google Drive links if present
    const finalFormData = {
      ...formData,
      mediaUrl: transformGoogleDriveUrl(formData.mediaUrl)
    };

    try {
      if (editingId) {
        await updateBanner(editingId, finalFormData);
      } else {
        await addBanner(finalFormData);
      }

      setFormData({
        title: '',
        date: '',
        startDate: '',
        endDate: '',
        location: '',
        language: 'English / Arabic',
        mediaUrl: '',
        mediaType: 'image'
      });
      setAutoFormat(true);
      setShowAddBanner(false);
      setEditingId(null);
      fetchBanners();
    } catch (err) {
      alert('Save failed: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (banner) => {
    setFormData({
      title: banner.title,
      date: banner.date || '',
      startDate: banner.startDate || '',
      endDate: banner.endDate || '',
      location: banner.location || '',
      description: banner.description || '',
      eventColor: banner.eventColor || '#E31E24',
      order: banner.order !== undefined ? banner.order : 1,
      language: banner.language || 'English / Arabic',
      mediaUrl: banner.mediaUrl,
      mediaType: banner.mediaType || 'image'
    });
    setAutoFormat(!!(banner.startDate || banner.endDate));
    setEditingId(banner.id);
    setShowAddBanner(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setFormData({
      title: '',
      date: '',
      location: '',
      description: '',
      eventColor: '#E31E24',
      order: 1,
      language: 'English / Arabic',
      mediaUrl: '',
      mediaType: 'image'
    });
    setEditingId(null);
    setShowAddBanner(false);
  };

  const handleDelete = async (id) => {
    try {
      await deleteBanner(id);
      setDeleteConfirmId(null);
      fetchBanners();
    } catch (err) {
      alert('Delete failed: ' + err.message);
    }
  };

  return (
    <div className="admin-dashboard-page">
      <div className="admin-dashboard-content">
        <button className="admin-back-btn-minimal" onClick={() => navigate('/profile')}>
          <ArrowLeft size={18} />
          <span>Profile</span>
        </button>

        {showAddBanner && (
          <div className="admin-form-card">
            <div className="admin-form-header">
              <h3>{editingId ? 'Edit Event Banner' : 'Add New Homepage Banner'}</h3>
              <button className="close-form-btn" onClick={resetForm}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="admin-banner-form">
              <div className="admin-form-grid">
                <div className="admin-field">
                  <label>Event Title</label>
                  <input
                    required
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., GCC Exhibition 2024"
                  />
                </div>
                <div className="admin-field">
                  <label>Display Order (1st, 2nd...)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.order}
                    onChange={e => setFormData({ ...formData, order: parseInt(e.target.value) || 1 })}
                    placeholder="1"
                  />
                </div>
                <div className="admin-field">
                  <label>Language Badge</label>
                  <input
                    value={formData.language}
                    onChange={e => setFormData({ ...formData, language: e.target.value })}
                    placeholder="e.g., English / Arabic"
                  />
                </div>
                <div className="admin-field">
                  <label>Event Date (Pick Range)</label>
                  <div className="date-picker-row">
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                      placeholder="Start Date"
                    />
                    <span className="date-separator">to</span>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                      placeholder="End Date"
                    />
                  </div>
                </div>
                <div className="admin-field">
                  <label className="checkbox-field">
                    <input 
                      type="checkbox" 
                      checked={autoFormat} 
                      onChange={e => setAutoFormat(e.target.checked)} 
                    />
                    <span>Auto-format Date Text</span>
                  </label>
                  <input
                    required
                    value={formData.date}
                    onChange={e => {
                      setFormData({ ...formData, date: e.target.value });
                      if (autoFormat) setAutoFormat(false);
                    }}
                    placeholder="e.g., 25 - 27 September 2024"
                  />
                  <small className="field-hint">Edit this field manually to override the picker</small>
                </div>
                <div className="admin-field">
                  <label>Location</label>
                  <input
                    required
                    value={formData.location}
                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g., Manarat, Al Saadiyat, UAE"
                  />
                </div>
                <div className="admin-field">
                  <label>Theme Color</label>
                  <div className="color-picker-container">
                    <input
                      type="color"
                      value={formData.eventColor}
                      onChange={e => setFormData({ ...formData, eventColor: e.target.value })}
                    />
                    <input
                      type="text"
                      value={formData.eventColor}
                      onChange={e => setFormData({ ...formData, eventColor: e.target.value })}
                      placeholder="#E31E24"
                    />
                  </div>
                </div>
              </div>

              <div className="admin-field full-width">
                <label>Event Description</label>
                <textarea
                  required
                  rows={4}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the event details..."
                />
              </div>

              <div className="admin-field full-width">
                <label>Media Source</label>
                <div className="media-toggle-tabs">
                  <button
                    type="button"
                    className={formData.mediaType === 'image' ? 'active' : ''}
                    onClick={() => setFormData({ ...formData, mediaType: 'image' })}
                  >
                    <ImageIcon size={16} /> Image
                  </button>
                  <button
                    type="button"
                    className={formData.mediaType === 'video' ? 'active' : ''}
                    onClick={() => setFormData({ ...formData, mediaType: 'video' })}
                  >
                    <Video size={16} /> Video
                  </button>
                </div>

                <div className="media-input-wrapper">
                  <div className="url-input-container">
                    <LinkIcon size={18} className="input-icon" />
                    <input
                      type="url"
                      placeholder="Paste Image/Video URL from Google Drive, cPanel, or YouTube..."
                      value={formData.mediaUrl.startsWith('data:') ? '' : formData.mediaUrl}
                      onChange={e => setFormData({ ...formData, mediaUrl: e.target.value })}
                    />
                  </div>
                  <small className="field-hint">
                    For Google Drive, ensure the file is shared as <strong>"Anyone with the link"</strong>.
                  </small>

                  {formData.mediaType === 'image' && (
                    <>
                      <div className="or-divider">OR</div>
                      <label className="file-upload-label">
                        <Upload size={18} />
                        <span>Upload Direct (Max 1MB)</span>
                        <input type="file" accept="image/*" onChange={handleFileUpload} hidden />
                      </label>
                    </>
                  )}
                </div>

                {formData.mediaUrl && (
                  <div className="media-preview-mini">
                    {formData.mediaType === 'image' ? (
                      <img src={formData.mediaUrl} alt="Preview" />
                    ) : (
                      <div className="video-preview-placeholder">
                        <Video size={32} />
                        <span>Video URL Linked</span>
                      </div>
                    )}
                    <button type="button" className="clear-media" onClick={() => setFormData({ ...formData, mediaUrl: '' })}>
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>

              <button type="submit" className="admin-submit-btn" disabled={isSubmitting || !formData.mediaUrl}>
                <Save size={18} />
                <span>{isSubmitting ? 'Saving...' : editingId ? 'Update Banner' : 'Save Banner'}</span>
              </button>
            </form>
          </div>
        )}

        <div className="admin-banners-grid-container">
          <div className="banners-grid">
            {/* The "Add New" Trigger Card */}
            {!showAddBanner && (
              <div 
                className="admin-banner-card add-trigger-card" 
                onClick={() => setShowAddBanner(true)}
              >
                <div className="add-trigger-content">
                  <div className="add-icon-circle">
                    <Plus size={32} />
                  </div>
                  <span>Add Homepage Banner</span>
                </div>
              </div>
            )}

            {loading ? (
              <div className="admin-loading-placeholder">
                <p>Loading banners...</p>
              </div>
            ) : (
              banners.map(banner => (
                <div key={banner.id} className="admin-banner-card">
                  <div className="card-media">
                    {banner.mediaType === 'image' ? (
                      <img src={banner.mediaUrl} alt={banner.title} />
                    ) : (
                      <div className="video-card-icon"><Video size={32} /></div>
                    )}
                    <div className="card-badge">{banner.language}</div>
                  </div>
                  <div className="card-info">
                    <h3>{banner.title}</h3>
                    <p className="card-meta">{banner.date} • {banner.location}</p>
                    <div className="card-actions-row">
                      <button className="banner-edit-btn" onClick={() => handleEdit(banner)}>
                        <Edit2 size={16} />
                        <span>Edit</span>
                      </button>
                      <button className="banner-delete-btn" onClick={() => setDeleteConfirmId(banner.id)}>
                        <Trash2 size={16} />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Custom Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="admin-modal-backdrop">
          <div className="delete-modal-container">
            <h3>Delete Banner?</h3>
            <p>This action cannot be undone. Are you sure you want to remove this banner?</p>
            <div className="delete-modal-actions">
              <button 
                className="cancel-delete-btn" 
                onClick={() => setDeleteConfirmId(null)}
              >
                Cancel
              </button>
              <button 
                className="confirm-delete-btn" 
                onClick={() => handleDelete(deleteConfirmId)}
              >
                Delete Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
