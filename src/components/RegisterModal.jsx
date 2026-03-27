import { useState, useEffect, useRef } from 'react';
import { X, User, Building, Users, GraduationCap, Globe, Phone, Calendar, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';
import ReCAPTCHA from "react-google-recaptcha";

const COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan",
  "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi",
  "Cabo Verde", "Cambodia", "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czech Republic",
  "Denmark", "Djibouti", "Dominica", "Dominican Republic",
  "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia",
  "Fiji", "Finland", "France",
  "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana",
  "Haiti", "Honduras", "Hungary",
  "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy",
  "Jamaica", "Japan", "Jordan",
  "Kazakhstan", "Kenya", "Kiribati", "Kuwait", "Kyrgyzstan",
  "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg",
  "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar",
  "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway",
  "Oman",
  "Pakistan", "Palau", "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal",
  "Qatar",
  "Romania", "Russia", "Rwanda",
  "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria",
  "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu",
  "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan",
  "Vanuatu", "Vatican City", "Venezuela", "Vietnam",
  "Yemen",
  "Zambia", "Zimbabwe"
];

const INTERESTS = [
  "Engineering & Technology",
  "Medicine & Health Sciences",
  "Business & Management",
  "Arts & Humanities",
  "Social Sciences",
  "Natural Sciences",
  "Computer Science & AI",
  "Law & Legal Studies",
  "Architecture & Design",
  "Education & Teaching",
  "Communication & Media",
  "Hospitality & Tourism",
  "Others"
];

const JOB_TITLES = [
  "School Principal",
  "Head Teacher/Teacher",
  "Student Advisor/Faculty",
  "University Advisor/Faculty",
  "Other"
];

export default function RegisterModal({ isOpen, onClose, event }) {
  const [step, setStep] = useState(1);
  const [regType, setRegType] = useState(null); // 'individual' or 'school'
  const [captchaValue, setCaptchaValue] = useState(null);
  const [error, setError] = useState(null);

  const [user] = useState(JSON.parse(localStorage.getItem('user')) || { name: 'Guest User', email: '' });

  const [formData, setFormData] = useState({
    email: user?.email || '',
    fullName: '',
    mobile: '',
    dob: '',
    country: '',
    nationality: '',
    userType: '', // Student | Parent | Academic
    universityName: '',
    grade: '',
    gradeOther: '',
    interest: '',
    interestOthers: '',
    schoolName: '',
    contactNumber: '',
    address: '',
    schoolId: '',
    jobTitle: '',
    jobTitleOther: '',
    schoolType: '', // Public | Private
    numStudents: '',
    numTeachers: '',
  });

  const isMounted = useRef(true);
  useEffect(() => { return () => { isMounted.current = false; }; }, []);

  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setRegType(null);
      setError(null);
      setCaptchaValue(null);
      setFormData({
        email: user?.email || '',
        fullName: '',
        mobile: '',
        dob: '',
        country: '',
        nationality: '',
        userType: '',
        universityName: '',
        grade: '',
        gradeOther: '',
        interest: '',
        interestOthers: '',
        schoolName: '',
        contactNumber: '',
        address: '',
        schoolId: '',
        jobTitle: '',
        jobTitleOther: '',
        schoolType: '',
        numStudents: '',
        numTeachers: '',
      });
    }
  }, [isOpen, user?.email]);

  if (!isOpen) return null;

  const handleNextStep = () => {
    if (step === 1) {
      if (!formData.email) {
        setError("Please enter your email address.");
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setError("Please enter a valid email address.");
        return;
      }
    }
    setError(null);
    setStep(prev => prev + 1);
  };

  const handleTypeSelect = (type) => {
    setRegType(type);
    setStep(3);
  };

  const handleRegister = (e) => {
    e.preventDefault();
    if (!captchaValue) {
      setError("Please verify that you are not a robot.");
      return;
    }
    console.log('Registration data:', { type: regType, ...formData });
    alert("Registration data collected! (Backend logic pending)");
  };

  const onCaptchaChange = (value) => {
    setCaptchaValue(value);
  };

  const renderStep1 = () => (
    <div className="refined-form">
      <div className="user-welcome-section">
        <p className="welcome-text">Hello There!</p>
        <p className="user-email-text">{user.email || 'Enter your email below'}</p>
      </div>
      <div className="refined-form-group">
        <label>Email Address</label>
        <input
          type="email"
          placeholder="name@example.com"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />
      </div>
      <button className="refined-submit-btn" onClick={handleNextStep}>
        Continue <ArrowRight size={18} style={{ marginLeft: '8px' }} />
      </button>
    </div>
  );

  const renderStep2 = () => (
    <div className="refined-form">
      <div className="user-welcome-section">
        <p className="welcome-text">Registration Type</p>
        <p className="user-email-text">Are you attending as an individual or representing a school?</p>
      </div>
      <div className="registration-type-grid">
        <div
          className={`type-selection-card ${regType === 'individual' ? 'active' : ''}`}
          onClick={() => handleTypeSelect('individual')}
        >
          <div className="type-icon-wrapper">
            <User size={32} />
          </div>
          <span>Individual</span>
        </div>
        <div
          className={`type-selection-card ${regType === 'school' ? 'active' : ''}`}
          onClick={() => handleTypeSelect('school')}
        >
          <div className="type-icon-wrapper">
            <Building size={32} />
          </div>
          <span>School</span>
        </div>
      </div>
    </div>
  );

  const renderIndividualForm = () => (
    <form className="refined-form" onSubmit={handleRegister}>
      <div className="refined-form-group">
        <label>Email (Prefilled)</label>
        <input type="email" value={formData.email} disabled />
      </div>

      <div className="refined-form-group">
        <label>Full Name*</label>
        <input
          type="text"
          placeholder="Your full name"
          value={formData.fullName}
          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
          required
        />
      </div>

      <div className="refined-form-group">
        <label>Mobile*</label>
        <input
          type="tel"
          placeholder="+971 -- --- ----"
          value={formData.mobile}
          onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
          required
        />
      </div>

      <div className="refined-form-group">
        <label>Date of Birth* (mm/dd/yyyy)</label>
        <input
          type="date"
          value={formData.dob}
          onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
          required
        />
      </div>

      <div className="refined-form-group">
        <label>Select Country*</label>
        <select
          value={formData.country}
          onChange={(e) => setFormData({ ...formData, country: e.target.value })}
          required
        >
          <option value="">Select Country</option>
          {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="refined-form-group">
        <label>Nationality*</label>
        <input
          type="text"
          placeholder="Your nationality"
          value={formData.nationality}
          onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
          required
        />
      </div>

      <div className="refined-form-group">
        <label>You are?*</label>
        <div className="radio-group-horizontal">
          {['Student', 'Parent', 'Academic'].map(type => (
            <label key={type} className="radio-option">
              <input
                type="radio"
                name="userType"
                value={type}
                checked={formData.userType === type}
                onChange={(e) => setFormData({ ...formData, userType: e.target.value })}
                required
              />
              {type}
            </label>
          ))}
        </div>
      </div>

      {formData.userType === 'Student' && (
        <>
          <div className="refined-form-group">
            <label>Name of University/School*</label>
            <input
              type="text"
              placeholder="Institution name"
              value={formData.universityName}
              onChange={(e) => setFormData({ ...formData, universityName: e.target.value })}
              required
            />
          </div>
          <div className="refined-form-group">
            <label>Grade*</label>
            <select
              value={formData.grade}
              onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
              required
            >
              <option value="">Select Grade</option>
              {['10th', '11th', '12th', 'Others'].map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          {formData.grade === 'Others' && (
            <div className="refined-form-group">
              <label>Other Grade*</label>
              <input
                type="text"
                placeholder="Specify grade"
                value={formData.gradeOther}
                onChange={(e) => setFormData({ ...formData, gradeOther: e.target.value })}
                required
              />
            </div>
          )}
        </>
      )}

      <div className="refined-form-group">
        <label>What are you interested in?*</label>
        <select
          value={formData.interest}
          onChange={(e) => setFormData({ ...formData, interest: e.target.value })}
          required
        >
          <option value="">Select Interest</option>
          {INTERESTS.map(i => <option key={i} value={i}>{i}</option>)}
        </select>
      </div>

      {formData.interest === 'Others' && (
        <div className="refined-form-group">
          <label>Others*</label>
          <input
            type="text"
            placeholder="Please specify"
            value={formData.interestOthers}
            onChange={(e) => setFormData({ ...formData, interestOthers: e.target.value })}
            required
          />
        </div>
      )}

      <div className="recaptcha-wrapper">
        <ReCAPTCHA
          sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY || "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"}
          onChange={onCaptchaChange}
        />
      </div>

      <div className="form-actions-row">
        <button type="button" className="btn-cancel-modal" onClick={onClose}>Cancel</button>
        <button type="submit" className="refined-submit-btn">Register</button>
      </div>
    </form>
  );

  const renderSchoolForm = () => (
    <form className="refined-form" onSubmit={handleRegister}>
      <div className="refined-form-group">
        <label>Email (Prefilled)</label>
        <input type="email" value={formData.email} disabled />
      </div>

      <div className="refined-form-group">
        <label>University / School Name*</label>
        <input
          type="text"
          placeholder="Institution name"
          value={formData.schoolName}
          onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
          required
        />
      </div>

      <div className="refined-form-group">
        <label>Contact Number</label>
        <input
          type="tel"
          placeholder="+971 -- --- ----"
          value={formData.contactNumber}
          onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
        />
      </div>

      <div className="refined-form-group">
        <label>Address</label>
        <input
          type="text"
          placeholder="City, Area"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
        />
      </div>

      <div className="refined-form-group">
        <label>University/School ID</label>
        <input
          type="text"
          placeholder="ID Number"
          value={formData.schoolId}
          onChange={(e) => setFormData({ ...formData, schoolId: e.target.value })}
        />
      </div>

      <div className="refined-form-group">
        <label>Job Title</label>
        <select
          value={formData.jobTitle}
          onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
        >
          <option value="">Select Job Title</option>
          {JOB_TITLES.map(j => <option key={j} value={j}>{j}</option>)}
        </select>
      </div>

      {formData.jobTitle === 'Other' && (
        <div className="refined-form-group">
          <label>Other Job Title*</label>
          <input
            type="text"
            placeholder="Your job title"
            value={formData.jobTitleOther}
            onChange={(e) => setFormData({ ...formData, jobTitleOther: e.target.value })}
            required
          />
        </div>
      )}

      <div className="refined-form-group">
        <label>School Type*</label>
        <div className="radio-group-horizontal">
          {['Public', 'Private'].map(type => (
            <label key={type} className="radio-option">
              <input
                type="radio"
                name="schoolType"
                value={type}
                checked={formData.schoolType === type}
                onChange={(e) => setFormData({ ...formData, schoolType: e.target.value })}
                required
              />
              {type}
            </label>
          ))}
        </div>
      </div>

      <div className="refined-form-group">
        <label>Number of students visiting*</label>
        <div className="icon-number-input">
          <Users className="input-icon-left" size={18} />
          <input
            type="number"
            placeholder="0"
            value={formData.numStudents}
            onChange={(e) => setFormData({ ...formData, numStudents: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="refined-form-group">
        <label>Number of teachers visiting*</label>
        <div className="icon-number-input">
          <GraduationCap className="input-icon-left" size={18} />
          <input
            type="number"
            placeholder="0"
            value={formData.numTeachers}
            onChange={(e) => setFormData({ ...formData, numTeachers: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="recaptcha-wrapper">
        <ReCAPTCHA
          sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY || "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"}
          onChange={onCaptchaChange}
        />
      </div>

      <div className="form-actions-row">
        <button type="button" className="btn-cancel-modal" onClick={onClose}>Cancel</button>
        <button type="submit" className="refined-submit-btn">Register</button>
      </div>
    </form>
  );

  return (
    <div className="modal-backdrop">
      <div className="modal-container" onClick={e => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="registration-container-refined modal-mode">
          <div className="registration-steps">
            <div className={`step-dot ${step >= 1 ? 'active' : ''}`} />
            <div className={`step-dot ${step >= 2 ? 'active' : ''}`} />
            <div className={`step-dot ${step >= 3 ? 'active' : ''}`} />
          </div>

          <h2 className="event-title-context">Register for Event</h2>
          <p style={{ marginTop: '-16px', marginBottom: '24px', color: 'var(--color-gray-600)' }}>{event?.title}</p>

          {error && <div className="form-error-banner">{error}</div>}

          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && (regType === 'individual' ? renderIndividualForm() : renderSchoolForm())}
        </div>
      </div>
    </div>
  );
}
