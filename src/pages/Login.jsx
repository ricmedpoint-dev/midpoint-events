import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, LogIn, ArrowRight } from 'lucide-react';
import { auth, googleProvider } from '../firebase/config';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (email === 'admin@midpoint.ae' && password === '0987654321') {
      login({
        uid: 'admin-uid',
        name: 'Admin',
        email: 'admin@midpoint.ae',
        isAdmin: true
      });
      navigate('/');
      setLoading(false);
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      login({
        uid: user.uid,
        name: user.displayName || 'User',
        email: user.email,
        photoURL: user.photoURL
      });
      navigate('/');
    } catch (err) {
      console.error('Login error:', err);
      setError('Invalid email or password. Please try again.');
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
    <div className="auth-page-container">
      <div className="auth-split-layout">
        {/* Left Side: Cinematic Branding */}
        <div className="auth-visual-side">
          <div className="auth-visual-overlay"></div>
          <img src="/images/auth-bg.png" alt="Events" className="auth-visual-img" />
          <div className="auth-visual-content">
            <img src="/logos/Midpoint_white.svg" alt="Midpoint Logo" className="auth-visual-logo" />
            <h1 className="auth-visual-tagline">Premium Event Experiences.</h1>
            <p className="auth-visual-subtext">Join the most exclusive exhibitions and conferences in the region.</p>
          </div>
        </div>

        {/* Right Side: Admin Login Form */}
        <div className="auth-form-side">
          <div className="auth-form-card">
            <div className="auth-form-header">
              <h2 className="auth-title">Admin Portal</h2>
              <p className="auth-subtitle">Authorized access only</p>
            </div>

            {error && <div className="form-error-banner">{error}</div>}

            <form className="auth-form" onSubmit={handleSignIn}>
              <div className="auth-input-group">
                <label>Admin Email</label>
                <div className="auth-input-wrapper">
                  <Mail className="auth-input-icon" size={20} />
                  <input 
                    type="email" 
                    placeholder="name@company.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required 
                  />
                </div>
              </div>

              <div className="auth-input-group">
                <div className="auth-label-row">
                  <label>Password</label>
                </div>
                <div className="auth-input-wrapper">
                  <Lock className="auth-input-icon" size={20} />
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    placeholder="••••••••" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required 
                  />
                  <button 
                    type="button" 
                    className="auth-password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button type="submit" className="auth-submit-btn" disabled={loading}>
                {loading ? (
                  <span className="btn-loading-content">Signing in...</span>
                ) : (
                  <>
                    <span>Enter Admin Panel</span>
                    <ArrowRight size={20} />
                  </>
                )}
              </button>
            </form>

            <button className="auth-skip-btn" onClick={() => navigate('/')}>Return to Website</button>
          </div>
        </div>
      </div>
    </div>
  );
}
