import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { auth, googleProvider } from '../firebase/config';
import { createUserWithEmailAndPassword, updateProfile, signInWithPopup } from 'firebase/auth';
import { useAuth } from '../context/AuthContext';

export default function SignUp() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      await updateProfile(userCredential.user, {
        displayName: formData.name
      });
      
      login({
        uid: userCredential.user.uid,
        name: formData.name,
        email: formData.email
      });
      navigate('/profile');
    } catch (err) {
      console.error('Sign up error:', err);
      setError('Failed to create account. ' + (err.message || ''));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      login({
        uid: user.uid,
        name: user.displayName,
        email: user.email,
        photoURL: user.photoURL
      });
      navigate('/');
    } catch (err) {
      console.error('Google sign-in error:', err);
      setError('Could not sign in with Google. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-header">
        <div className="login-logo-container">
          <div className="login-logo-circle">
            <img src="/logos/Midpoint_white.svg" alt="Midpoint Logo" className="login-logo-img" />
          </div>
        </div>
      </div>

      <div className="login-card">
        <h2 className="login-welcome">Create Account</h2>
        
        {error && <div className="form-error-banner">{error}</div>}

        <form className="login-form" onSubmit={handleSignUp}>
          <div className="login-input-group">
            <div className="login-input-wrapper">
              <User className="login-input-icon" size={20} />
              <input 
                type="text" 
                placeholder="Name" 
                required 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
          </div>

          <div className="login-input-group">
            <div className="login-input-wrapper">
              <Mail className="login-input-icon" size={20} />
              <input 
                type="email" 
                placeholder="Email" 
                required 
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
          </div>

          <div className="login-input-group">
            <div className="login-input-wrapper">
              <Lock className="login-input-icon" size={20} />
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="Password" 
                required 
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
              <button 
                type="button" 
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button type="submit" className="login-submit-btn" disabled={loading}>
            <span>{loading ? 'Signing Up...' : 'Sign Up'}</span>
            <ArrowRight size={20} />
          </button>
        </form>

        <div className="login-divider">
          <span>OR</span>
        </div>

        <button className="google-login-btn" onClick={handleGoogleSignIn} disabled={loading}>
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" />
          <span>Sign up with Google</span>
        </button>

        <div className="login-footer">
          <p>Already have an account? <Link to="/login">Sign In</Link></p>
          <button className="skip-link" onClick={() => navigate('/')}>Skip for now</button>
        </div>
      </div>
    </div>
  );
}
