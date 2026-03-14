import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { User as UserIcon, LogOut, Edit2, X, Shield, Mail, Phone, Calendar, Camera, Upload } from 'lucide-react';
import { updateProfile as updateFirestoreProfile } from '../firebase/firestore';
import { auth } from '../firebase/config';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const navigate = useNavigate();
  const { user, updateUser, logout, isAdmin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showZoomModal, setShowZoomModal] = useState(false);
  const [editData, setEditData] = useState({ name: '', phone: '' });
  const [saving, setSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [imgError, setImgError] = useState(false);
  const isMounted = useRef(true);
  const fileInputRef = useRef(null);

  // --- Image Compression Utility ---
  const compressImage = (file, maxWidth = 400, maxHeight = 400, quality = 0.7) => {
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

          // Maintain aspect ratio
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

          // Convert to Base64 with quality reduction
          const base64 = canvas.toDataURL('image/jpeg', quality);
          resolve(base64);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  useEffect(() => {
    return () => { isMounted.current = false; };
  }, []);

  // Sync editData ONLY when modal opens to avoid resetting while typing
  useEffect(() => {
    if (showEditModal && user) {
      setEditData({
        name: user.name || '',
        phone: user.phone || ''
      });
    }
  }, [showEditModal, user]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleUpdate = async (e) => {
    if (e) e.preventDefault();
    if (saving) return;

    setSaving(true);
    console.log('Profile: handleUpdate started');
    
    try {
      const currentUid = user?.uid;
      const isShortcut = currentUid === 'admin-uid';

      if (currentUid && !isShortcut) {
        const dataToSave = {
          ...editData,
          email: user?.email
        };
        console.log('Profile: Saving to Firestore...', dataToSave);
        await updateFirestoreProfile(currentUid, dataToSave);
        console.log('Profile: Firestore save successful');
      }
      
      updateUser(editData);
      setShowEditModal(false);
    } catch (err) {
      console.error('Profile update failed:', err);
      alert('Failed to save changes: ' + (err.message || 'Unknown error'));
    } finally {
      console.log('Profile: handleUpdate finished');
      setSaving(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type and size (e.g., max 2MB)
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert('File size too large. Please select an image under 2MB.');
      return;
    }

    setIsUploading(true);
    try {
      const currentUid = user?.uid;
      
      console.log('Profile: Compressing image...');
      const base64Image = await compressImage(file);
      console.log('Profile: Compression complete. Size:', (base64Image.length / 1024).toFixed(2), 'KB');

      if (!currentUid || currentUid === 'admin-uid') {
        // For admin shortcut, we'll just update context/local
        updateUser({ photoURL: base64Image });
        alert('Admin Shortcut: Profile picture updated locally.');
      } else {
        console.log('Profile: Saving Base64 to Firestore...');
        // Save Base64 string directly to Firestore field
        await updateFirestoreProfile(currentUid, { photoURL: base64Image });
        
        // Update local context
        updateUser({ photoURL: base64Image });
        console.log('Profile: Save successful');
      }
      setImgError(false);
    } catch (error) {
      console.error('Avatar upload failed:', error);
      alert('Failed to update photo: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  if (loading) return <div className="loading-state">Loading...</div>;

  const initials = (user?.name || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const joinDate = user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Recently joined';
  const avatarSrc = user?.photoURL && !imgError ? user.photoURL : '/default-avatar.png';

  return (
    <div className="profile-page">
      {/* Profile Card */}
      <div className="profile-card">
        <div className="profile-card-top">
          <div className="profile-avatar-large" onClick={() => setShowZoomModal(true)}>
            <img 
              src={avatarSrc} 
              alt={user?.name} 
              className="avatar-img" 
              onError={() => setImgError(true)}
            />
            {isUploading && (
              <div className="upload-loading-overlay">
                <div className="spinner-small"></div>
              </div>
            )}
            {isAdmin && (
              <div className="admin-badge-avatar" title="Administrator">
                <Shield size={14} fill="currentColor" />
              </div>
            )}
            <div className="avatar-edit-hint">
              <Camera size={16} />
            </div>
          </div>
          
          <h1 className="profile-display-name">{user?.name || 'User'}</h1>
          {isAdmin && <span className="admin-tag">Administrator</span>}


          <div className="profile-top-actions">
            <button className="profile-action-btn edit-btn" onClick={() => setShowEditModal(true)}>
              <Edit2 size={16} />
              <span>Edit Profile</span>
            </button>
            {isAdmin && (
              <button className="profile-action-btn admin-dashboard-pill" onClick={() => navigate('/admin')}>
                <Shield size={16} />
                <span>Dashboard</span>
              </button>
            )}
          </div>
        </div>

        <div className="profile-info-list">
          <div className="profile-info-item">
            <Calendar size={20} />
            <span>Joined {joinDate}</span>
          </div>
          <div className="profile-info-item">
            <Phone size={20} />
            <span>{user?.phone || 'No phone provided'}</span>
          </div>
          <div className="profile-info-item">
            <Mail size={20} />
            <span>{user?.email} ({auth.currentUser?.emailVerified ? 'Verified' : 'Pending'})</span>
          </div>
        </div>

        <div className="profile-actions">
          <button className="profile-action-btn logout-btn" onClick={handleLogout}>
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        style={{ display: 'none' }} 
        accept="image/*"
        onChange={handleFileChange}
      />

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="modal-backdrop">
          <div className="modal-container">
            <div className="registration-container-refined modal-mode">
              <button className="modal-close-btn" onClick={() => setShowEditModal(false)}>
                <X size={20} />
              </button>
              
              <h2 className="event-title-context">Edit Profile</h2>
              <p className="form-instruction">Update your display name and contact details below.</p>
              
              <form onSubmit={handleUpdate} className="refined-form">
                <div className="refined-form-group">
                  <label>Display Name</label>
                  <input 
                    type="text" 
                    value={editData.name}
                    onChange={(e) => setEditData({...editData, name: e.target.value})}
                    placeholder="Enter your name"
                    required
                  />
                </div>

                <div className="refined-form-group">
                  <label>Phone Number</label>
                  <input 
                    type="tel" 
                    value={editData.phone}
                    onChange={(e) => setEditData({...editData, phone: e.target.value})}
                    placeholder="+971 -- --- ----"
                  />
                </div>

                <button type="submit" className="refined-submit-btn" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Avatar Zoom Modal */}
      {showZoomModal && (
        <div className="avatar-zoom-overlay" onClick={() => setShowZoomModal(false)}>
          <div className="zoom-content-container" onClick={e => e.stopPropagation()}>
            <button className="zoom-close-btn" onClick={() => setShowZoomModal(false)}>
              <X size={32} />
            </button>
            <img 
              src={avatarSrc} 
              alt={user?.name} 
              className="zoomed-avatar" 
              onError={() => setImgError(true)}
            />
            <div className="zoom-actions">
              <button 
                className="replace-avatar-btn" 
                onClick={() => {
                  setShowZoomModal(false);
                  fileInputRef.current.click();
                }}
                disabled={isUploading}
              >
                <Upload size={18} />
                <span>{user?.photoURL ? 'Replace Photo' : 'Upload Photo'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
