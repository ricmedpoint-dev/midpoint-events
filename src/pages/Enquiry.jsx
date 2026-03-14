import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { addEnquiry, getEvents } from '../firebase/firestore';

export default function Enquiry() {
  const navigate = useNavigate();
  const location = useLocation();
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [user] = useState(JSON.parse(localStorage.getItem('user')) || { name: 'splangcard5', email: 'splangcard5@gmail.com' });
  const [selectedEvent, setSelectedEvent] = useState(null);

  const [formData, setFormData] = useState({
    jobTitle: '',
    companyName: '',
    phone: '',
    country: '',
    address: '',
    interestedIn: '',
    comments: '',
    eventId: location.state?.eventId || '',
  });

  useEffect(() => {
    async function fetchEvents() {
      const e = await getEvents();
      if (location.state?.eventId) {
        setSelectedEvent(e.find(ev => ev.id === location.state.eventId));
      }
    }
    fetchEvents();
  }, [location.state?.eventId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    console.log('Submitting enquiry:', formData);
    try {
      await addEnquiry({
        ...formData,
        userName: user.name,
        userEmail: user.email
      });
      console.log('Enquiry submission success');
      setSuccess(true);
      setTimeout(() => navigate('/'), 3000);
    } catch (err) {
      console.error('Enquiry failed:', err);
      setError('Failed to submit enquiry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="registration-success-page">
        <div className="success-icon">✓</div>
        <h1>Enquiry Submitted!</h1>
        <p>Thank you for your interest. We will contact you soon.</p>
        <button className="btn-primary" onClick={() => navigate('/')}>Return Home</button>
      </div>
    );
  }

  return (
    <div className="register-page white-bg">
      <div className="register-header-simple">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ChevronLeft size={24} />
        </button>
        <h1>Enquire to Exhibit</h1>
      </div>

      <div className="registration-container-refined">
        <h2 className="event-title-context">{selectedEvent?.title || 'Event'} - Enquiry Form</h2>
        
        <div className="user-welcome-section">
          <p className="welcome-text">Welcome, {user.name}!</p>
          <p className="user-email-text">{user.email}</p>
        </div>

        {error && <div className="form-error-banner">{error}</div>}

        <form className="refined-form" onSubmit={handleSubmit}>
          <div className="refined-form-group">
            <input 
              type="text" 
              placeholder="Job Title"
              value={formData.jobTitle}
              onChange={(e) => setFormData({...formData, jobTitle: e.target.value})}
              required 
            />
          </div>

          <div className="refined-form-group">
            <input 
              type="text" 
              placeholder="University/Company Name"
              value={formData.companyName}
              onChange={(e) => setFormData({...formData, companyName: e.target.value})}
              required 
            />
          </div>

          <div className="refined-form-group">
            <input 
              type="tel" 
              placeholder="Phone Number"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              required 
            />
          </div>

          <div className="refined-form-group">
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
            <input 
              type="text" 
              placeholder="Address Town/City"
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
              required 
            />
          </div>

          <div className="refined-form-group">
            <select 
              value={formData.interestedIn}
              onChange={(e) => setFormData({...formData, interestedIn: e.target.value})}
              required
            >
              <option value="">Interested in</option>
              <option value="exhibiting">Exhibiting</option>
              <option value="sponsorship">Sponsorship</option>
              <option value="partnership">Partnership</option>
            </select>
          </div>

          <div className="refined-form-group">
            <textarea 
              placeholder="Other Comments"
              value={formData.comments}
              onChange={(e) => setFormData({...formData, comments: e.target.value})}
              rows={4}
            />
          </div>

          <button type="submit" className="refined-submit-btn" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Enquiry'}
          </button>
        </form>
      </div>
    </div>
  );
}
