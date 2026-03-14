import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { addRegistrant } from '../firebase/firestore';

export default function RegisterModal({ isOpen, onClose, event }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [user] = useState(JSON.parse(localStorage.getItem('user')) || { name: 'Guest User', email: '' });
  
  const [formData, setFormData] = useState({
    fullName: user.name,
    phone: '',
    role: '',
    country: '',
    field: '',
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
    if (!user.email && !formData.email) {
       setError("Please log in to register.");
       return;
    }
    setLoading(true);
    setError(null);
    try {
      await addRegistrant({
        ...formData,
        email: user.email || formData.email
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
      console.error('Registration failed:', err);
      setError('Failed to register. Please try again later.');
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
              <h2 style={{ marginBottom: '12px' }}>Successfully Registered!</h2>
              <p style={{ color: 'var(--color-gray-600)' }}>You have been registered for {event?.title}.</p>
            </div>
          ) : (
            <>
              <h2 className="event-title-context">{event?.title || 'Event Registration'}</h2>
              
              <div className="user-welcome-section">
                <p className="welcome-text">Hi {user.name}!</p>
                <p className="user-email-text">{user.email || 'Please complete your profile'}</p>
              </div>

              <p className="form-instruction">Please fill up the form to register.</p>

              {error && <div className="form-error-banner">{error}</div>}

              <form className="refined-form" onSubmit={handleSubmit}>
                <div className="refined-form-group">
                  <label>Full Name</label>
                  <input 
                    type="text" 
                    value={formData.fullName}
                    placeholder="Enter your full name"
                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
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
                  <label>Role</label>
                  <select 
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    required
                  >
                    <option value="">Select your role</option>
                    <option value="student">Student</option>
                    <option value="professional">Professional</option>
                    <option value="educator">Educator</option>
                  </select>
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
                  <label>Interest Field</label>
                  <select 
                    value={formData.field}
                    onChange={(e) => setFormData({...formData, field: e.target.value})}
                    required
                  >
                    <option value="">What field are you interested in?</option>
                    <option value="engineering">Engineering</option>
                    <option value="medicine">Medicine</option>
                    <option value="business">Business</option>
                    <option value="arts">Arts</option>
                  </select>
                </div>

                <button type="submit" className="refined-submit-btn" disabled={loading}>
                  {loading ? 'Registering...' : 'Register Now'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
