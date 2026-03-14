import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react';
import { auth, googleProvider } from '../firebase/config';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { useAuth } from '../hooks/useAuth';

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
    <div className="login-page">
      <div className="login-header">
        <div className="login-logo-container">
          <div className="login-logo-circle">
            <img src="/logos/Midpoint_white.svg" alt="Midpoint Logo" className="login-logo-img" />
          </div>
        </div>
      </div>

      <div className="login-card">
        <h2 className="login-welcome">Welcome to Midpoint Events.</h2>
        
        {error && <div className="form-error-banner">{error}</div>}

        <form className="login-form" onSubmit={handleSignIn}>
          <div className="login-input-group">
            <Mail className="input-icon" size={20} />
            <input 
              type="email" 
              placeholder="Email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>

          <div className="login-input-group">
            <Lock className="input-icon" size={20} />
            <input 
              type={showPassword ? 'text' : 'password'} 
              placeholder="Password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
            <button 
              type="button" 
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <button type="submit" className="login-submit-btn" disabled={loading}>
             <LogIn size={20} />
             <span>{loading ? 'Signing In...' : 'Sign In'}</span>
          </button>
        </form>

        <button className="forgot-password-link">Forgot Password?</button>

        <div className="login-divider">
          <span>OR</span>
        </div>

        <button className="google-login-btn" onClick={handleGoogleSignIn} disabled={loading}>
          <svg className="google-icon" width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <span>Sign in with Google</span>
        </button>

        <p className="signup-prompt">
          Don't have an account? <Link to="/signup">Sign Up</Link>
        </p>

        <button className="skip-link" onClick={() => navigate('/')}>Skip for now</button>
      </div>
    </div>
  );
}
