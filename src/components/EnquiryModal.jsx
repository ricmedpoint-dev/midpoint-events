import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { addEnquiry } from '../firebase/firestore';

export default function EnquiryModal({ isOpen, onClose, event }) {
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [user] = useState(JSON.parse(localStorage.getItem('user')) || { name: 'Guest User', email: '' });

  const [formData, setFormData] = useState({
    jobTitle: '',
    companyName: '',
    phone: '',
    country: '',
    address: '',
    interestedIn: '',
    comments: '',
    eventId: event?.id || '',
  });

  useEffect(() => {
    if (event) {
      setFormData(prev => ({ ...prev, eventId: event.id }));
    }
  }, [event]);

  const isMounted = useRef(true);
  useEffect(() => { return () => { isMounted.current = false; }; }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await addEnquiry({
        ...formData,
        userName: user.name,
        userEmail: user.email
      });
      if (!isMounted.current) return;
      setSuccess(true);
      setTimeout(() => {
        if (!isMounted.current) return;
        setSuccess(false);
        onClose();
      }, 2500);
    } catch (err) {
      if (!isMounted.current) return;
      console.error('Enquiry failed:', err);
      setError('Failed to submit enquiry. Please try again.');
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container" onClick={e => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="registration-container-refined modal-mode">
          {success ? (
            <div className="registration-success-content" style={{ textAlign: 'center', padding: '40px 0' }}>
              <div className="success-icon" style={{ margin: '0 auto 20px' }}>✓</div>
              <h2 style={{ marginBottom: '12px' }}>Enquiry Submitted!</h2>
              <p style={{ color: 'var(--color-gray-600)' }}>Thank you for your interest in {event?.title}.</p>
            </div>
          ) : (
            <>
              <h2 className="event-title-context">Enquire to Exhibit</h2>
              <p style={{ marginTop: '-16px', marginBottom: '24px', color: 'var(--color-gray-600)' }}>{event?.title}</p>
              
              <div className="user-welcome-section">
                <p className="welcome-text">Hi {user.name}!</p>
                <p className="user-email-text">{user.email || 'Guest Session'}</p>
              </div>

              {error && <div className="form-error-banner">{error}</div>}

              <form className="refined-form" onSubmit={handleSubmit}>
                <div className="refined-form-group">
                  <label>Job Title</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Student, Professor, Manager"
                    value={formData.jobTitle}
                    onChange={(e) => setFormData({...formData, jobTitle: e.target.value})}
                    required 
                  />
                </div>

                <div className="refined-form-group">
                  <label>University / Company</label>
                  <input 
                    type="text" 
                    placeholder="Name of institution"
                    value={formData.companyName}
                    onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                    required 
                  />
                </div>

                <div className="refined-form-group">
                  <label>Phone Number</label>
                  <input 
                    type="tel" 
                    placeholder="e.g. +971 50 123 4567"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    required 
                  />
                </div>

                <div className="refined-form-group">
                  <label>Country</label>
                  <select 
                    value={formData.country}
                    onChange={(e) => setFormData({...formData, country: e.target.value})}
                    required
                  >
                    <option value="">Select Country</option>
                    <option value="UAE">United Arab Emirates</option>
                    <option value="KSA">Saudi Arabia</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="refined-form-group">
                  <label>City / Town</label>
                  <input 
                    type="text" 
                    placeholder="Your current location"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    required 
                  />
                </div>

                <div className="refined-form-group">
                  <label>Interest Area</label>
                  <select 
                    value={formData.interestedIn}
                    onChange={(e) => setFormData({...formData, interestedIn: e.target.value})}
                    required
                  >
                    <option value="">How would you like to join?</option>
                    <option value="exhibiting">Exhibiting</option>
                    <option value="sponsorship">Sponsorship</option>
                    <option value="partnership">Partnership</option>
                  </select>
                </div>

                <div className="refined-form-group">
                  <label>Comments</label>
                  <textarea 
                    placeholder="Tell us more about your interests..."
                    value={formData.comments}
                    onChange={(e) => setFormData({...formData, comments: e.target.value})}
                    rows={3}
                    style={{ resize: 'none' }}
                  />
                </div>

                <button type="submit" className="refined-submit-btn" disabled={loading}>
                  {loading ? 'Submitting...' : 'Submit Enquiry'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
