import { useNavigate } from 'react-router-dom';
import { Shield, ArrowLeft, Plus, Trash2, Link as LinkIcon, Upload, X, Save, Image as ImageIcon, Video, Edit2, Home, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getBanners, addBanner, deleteBanner, updateBanner, getEvents, addEvent, updateEvent, deleteEvent } from '../firebase/firestore';
import { useAuth } from '../context/AuthContext';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [banners, setBanners] = useState([]);
  const [eventsList, setEventsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddBanner, setShowAddBanner] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [activeTab, setActiveTab] = useState('banners'); // 'banners' or 'events'
  const [draggedIdx, setDraggedIdx] = useState(null);
  const { isAdmin } = useAuth();

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    startDate: '', // Store for the picker
    endDate: '',   // Store for the picker
    eventTime: '', // New field for EmailJS
    eventCode: '', // New field for code generation (e.g. GCCAD)
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
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [bannersData, eventsData] = await Promise.all([
        getBanners(),
        getEvents()
      ]);
      setBanners(bannersData);
      setEventsList(eventsData);
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
    
    // Generate slug if not present
    const generatedSlug = formData.slug || formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    
    // Transform Google Drive links if present
    // Dynamically calculate the next display order value for new items
    const nextOrder = activeTab === 'banners' ? (banners.length + 1) : (eventsList.length + 1);
    const finalFormData = {
      ...formData,
      order: editingId ? formData.order : nextOrder,
      slug: generatedSlug,
      mediaUrl: transformGoogleDriveUrl(formData.mediaUrl)
    };

    try {
      if (activeTab === 'banners') {
        if (editingId) {
          await updateBanner(editingId, finalFormData);
        } else {
          // Adding a banner automatically adds it as an event too!
          await addBanner(finalFormData);
          await addEvent(finalFormData);
        }
      } else {
        if (editingId) {
          await updateEvent(editingId, finalFormData);
        } else {
          await addEvent(finalFormData);
        }
      }

      setFormData({
        title: '',
        date: '',
        startDate: '',
        endDate: '',
        eventTime: '',
        eventCode: '',
        location: '',
        description: '',
        eventColor: '#E31E24',
        order: 1,
        language: 'English / Arabic',
        mediaUrl: '',
        mediaType: 'image'
      });
      setAutoFormat(true);
      setShowAddBanner(false);
      setEditingId(null);
      fetchData();
    } catch (err) {
      alert('Save failed: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (item) => {
    setFormData({
      title: item.title,
      date: item.date || '',
      startDate: item.startDate || '',
      endDate: item.endDate || '',
      eventTime: item.eventTime || '',
      eventCode: item.eventCode || '',
      location: item.location || '',
      description: item.description || '',
      eventColor: item.eventColor || '#E31E24',
      order: item.order !== undefined ? item.order : 1,
      language: item.language || 'English / Arabic',
      mediaUrl: item.mediaUrl || '',
      mediaType: item.mediaType || 'image'
    });
    setAutoFormat(!!(item.startDate || item.endDate));
    setEditingId(item.id);
    setShowAddBanner(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setFormData({
      title: '',
      date: '',
      startDate: '',
      endDate: '',
      eventTime: '',
      eventCode: '',
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
    setAutoFormat(true);
  };

  const handleDelete = async (id) => {
    try {
      if (activeTab === 'banners') {
        await deleteBanner(id);
      } else {
        await deleteEvent(id);
      }
      setDeleteConfirmId(null);
      fetchData();
    } catch (err) {
      alert('Delete failed: ' + err.message);
    }
  };

  const handleDragStart = (e, index) => {
    setDraggedIdx(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === index) return;

    // Swap items in state array
    const list = activeTab === 'banners' ? [...banners] : [...eventsList];
    const draggedItem = list[draggedIdx];
    list.splice(draggedIdx, 1);
    list.splice(index, 0, draggedItem);

    if (activeTab === 'banners') {
      setBanners(list);
    } else {
      setEventsList(list);
    }
    setDraggedIdx(index);
  };

  const handleDragEnd = async () => {
    setDraggedIdx(null);
    try {
      const list = activeTab === 'banners' ? banners : eventsList;
      const promises = list.map((item, index) => {
        const newOrder = index + 1;
        if (item.order === newOrder) return Promise.resolve();
        return activeTab === 'banners'
          ? updateBanner(item.id, { order: newOrder })
          : updateEvent(item.id, { order: newOrder });
      });
      await Promise.all(promises);
    } catch (err) {
      console.error('Failed to save new order:', err);
    }
  };

  return (
    <div className="admin-dashboard-page">
      <div className="admin-dashboard-content">
        <button className="admin-back-btn-minimal" onClick={() => navigate('/')}>
          <ArrowLeft size={18} />
          <span>Home</span>
        </button>

        <div className="admin-tabs-nav">
          <button 
            className={`admin-tab-btn ${activeTab === 'banners' ? 'active' : ''}`}
            onClick={() => { setActiveTab('banners'); resetForm(); }}
          >
            Homepage Banners
          </button>
          <button 
            className={`admin-tab-btn ${activeTab === 'events' ? 'active' : ''}`}
            onClick={() => { setActiveTab('events'); resetForm(); }}
          >
            Events Directory
          </button>
        </div>

        {showAddBanner && (
          <div className="admin-form-card">
            <div className="admin-form-header">
              <h3>{editingId ? (activeTab === 'banners' ? 'Edit Homepage Banner' : 'Edit Event') : (activeTab === 'banners' ? 'Add New Homepage Banner' : 'Add New Event')}</h3>
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
                  <label>Event Code (Unique ID for QR)</label>
                  <input
                    required
                    value={formData.eventCode}
                    onChange={e => setFormData({ ...formData, eventCode: e.target.value.toUpperCase().replace(/\s+/g, '') })}
                    placeholder="e.g., GCCAD"
                  />
                  <small className="field-hint">Used for code: GCCAD-0000012026</small>
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
                  <label>Event Time (for Emails)</label>
                  <input
                    value={formData.eventTime}
                    onChange={e => setFormData({ ...formData, eventTime: e.target.value })}
                    placeholder="e.g., 9:00 AM - 4:00 PM"
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
                <span>
                  {isSubmitting 
                    ? 'Saving...' 
                    : (activeTab === 'banners' 
                        ? (editingId ? 'Update Banner' : 'Save Banner') 
                        : (editingId ? 'Update Event' : 'Save Event')
                      )
                  }
                </span>
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
                  <span>{activeTab === 'banners' ? 'Add Homepage Banner' : 'Add Event'}</span>
                </div>
              </div>
            )}

            {loading ? (
              <div className="admin-loading-placeholder">
                <p>Loading {activeTab === 'banners' ? 'banners' : 'events'}...</p>
              </div>
            ) : (
              (activeTab === 'banners' ? banners : eventsList).map((item, index) => (
                <div 
                  key={item.id} 
                  className={`admin-banner-card ${draggedIdx === index ? 'dragging' : ''}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                >
                  <div className="card-media">
                    {item.mediaType === 'image' ? (
                      <img src={item.mediaUrl} alt={item.title} />
                    ) : (
                      <div className="video-card-icon"><Video size={32} /></div>
                    )}
                    <div className="card-badge">{item.language}</div>
                  </div>
                  <div className="card-info">
                    <h3>{item.title}</h3>
                    <p className="card-meta">{item.date} • {item.location}</p>
                    <div className="card-actions-row">
                      <button className="banner-edit-btn" onClick={() => handleEdit(item)}>
                        <Edit2 size={16} />
                        <span>Edit</span>
                      </button>
                      <button 
                        className="banner-edit-btn" 
                        style={{ backgroundColor: '#f0f9ff', color: '#0369a1', borderColor: '#bae6fd' }}
                        onClick={() => navigate(`/event/${item.slug || item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')}`)}
                      >
                        <User size={16} />
                        <span>Exhibitors</span>
                      </button>
                      <button className="banner-delete-btn" onClick={() => setDeleteConfirmId(item.id)}>
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
            <h3>Delete {activeTab === 'banners' ? 'Banner' : 'Event'}?</h3>
            <p>This action cannot be undone. Are you sure you want to remove this {activeTab === 'banners' ? 'banner' : 'event'}?</p>
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
