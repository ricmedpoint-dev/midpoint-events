import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { addRegistrant, getEvents } from '../firebase/firestore';

export default function Register() {
  const navigate = useNavigate();
  const location = useLocation();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || { name: 'splangcard5', email: 'splangcard5@gmail.com' });
  
  const [formData, setFormData] = useState({
    fullName: user.name,
    phone: '',
    role: '',
    country: '',
    field: '',
    eventId: location.state?.eventId || '',
  });

  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    async function fetchData() {
      const e = await getEvents();
      setEvents(e);
      if (location.state?.eventId) {
        setSelectedEvent(e.find(ev => ev.id === location.state.eventId));
      }
    }
    fetchData();
  }, [location.state?.eventId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    console.log('Attempting registration with:', formData);
    try {
      const registrantData = {
        ...formData,
        email: user.email
      };
      const result = await addRegistrant(registrantData);
      console.log('Registration success, doc ID:', result);
      setSuccess(true);
      setTimeout(() => navigate('/'), 3000);
    } catch (err) {
      console.error('Registration failed:', err);
      setError('Failed to register. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="registration-success-page">
        <div className="success-icon">✓</div>
        <h1>Registration Successful!</h1>
        <p>Thank you for registering. You will be redirected soon.</p>
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
        <h1>Registration</h1>
      </div>

      <div className="registration-container-refined">
        <h2 className="event-title-context">{selectedEvent?.title || 'Event Registration'}</h2>
        
        <div className="user-welcome-section">
          <p className="welcome-text">Welcome, {user.name}!</p>
          <p className="user-email-text">{user.email}</p>
        </div>

        <p className="form-instruction">Please fill up the form.</p>

        {error && <div className="form-error-banner">{error}</div>}

        <form className="refined-form" onSubmit={handleSubmit}>
          <div className="refined-form-group">
            <label>Full Name</label>
            <input 
              type="text" 
              value={formData.fullName}
              onChange={(e) => setFormData({...formData, fullName: e.target.value})}
              required 
            />
          </div>

          <div className="refined-form-group">
            <label>Phone Number</label>
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
              value={formData.role}
              onChange={(e) => setFormData({...formData, role: e.target.value})}
              required
            >
              <option value="">Select Role</option>
              <option value="student">Student</option>
              <option value="professional">Professional</option>
              <option value="educator">Educator</option>
            </select>
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
            {loading ? 'Submitting...' : 'Submit'}
          </button>
        </form>
      </div>
    </div>
  );
}
