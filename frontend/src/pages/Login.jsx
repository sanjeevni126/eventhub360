import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('HR'); // Default as per screenshot
  const [error, setError] = useState('');
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password || !role) {
      setError('Please fill in all fields');
      return;
    }
    setError('');

    try {
      const response = await fetch('http://localhost:5001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role: role.toLowerCase() })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        window.location.href = '/dashboard';
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Failed to connect to the server');
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotEmail) {
      setError('Please enter your email address');
      return;
    }
    setError('');
    setForgotSuccess('');
    setForgotLoading(true);

    try {
      const response = await fetch('http://localhost:5001/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail })
      });
      const data = await response.json();
      if (response.ok) {
        setForgotSuccess(data.message || 'Reset link sent successfully!');
      } else {
        setError(data.error || 'Failed to send reset link.');
      }
    } catch (err) {
      setError('Failed to connect to the server');
    } finally {
      setForgotLoading(false);
    }
  };

  if (isForgotPassword) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-header">
            <h2>Forgot Password</h2>
            <p>Employee Central</p>
          </div>
          
          <p style={{ fontSize: '13px', color: '#666', lineHeight: '1.6', marginBottom: '20px', textAlign: 'center' }}>
            Enter your email address below to receive a password reset link. This link will allow you to securely reset your password.
          </p>

          {error && <div className="error-message">{error}</div>}
          {forgotSuccess && (
            <div className="success-message" style={{ color: '#28a745', backgroundColor: '#e8f5e9', padding: '10px', borderRadius: '4px', marginBottom: '15px', fontSize: '13px' }}>
              {forgotSuccess}
            </div>
          )}

          <form onSubmit={handleForgotPassword}>
            <div className="form-group">
              <label>Email Address</label>
              <input 
                type="email" 
                value={forgotEmail} 
                onChange={e => setForgotEmail(e.target.value)} 
                placeholder="your-email@example.com" 
                required 
                disabled={forgotLoading}
              />
            </div>
            
            <button type="submit" className="btn-primary" disabled={forgotLoading}>
              {forgotLoading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>

          <div className="auth-footer" style={{ marginTop: '20px' }}>
            <button 
              type="button" 
              onClick={() => {
                setIsForgotPassword(false);
                setError('');
                setForgotSuccess('');
                setForgotEmail('');
              }} 
              style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Employee Central Login</h2>
          <p>Employee Central</p>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="test@gmail.com" />
          </div>
          
          <div className="form-group" style={{ marginBottom: '10px' }}>
            <label>Password</label>
            <div className="password-input-wrapper" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••" style={{ width: '100%', paddingRight: '40px' }} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '10px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#6c757d' }}>
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" y1="2" x2="22" y2="22"/></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>
            <div style={{ textAlign: 'right', marginTop: '6px' }}>
              <button 
                type="button" 
                onClick={() => {
                  setIsForgotPassword(true);
                  setError('');
                }} 
                style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', fontSize: '13px', padding: 0 }}
              >
                Forgot Password?
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>Login As</label>
            <select value={role} onChange={e => setRole(e.target.value)}>
              <option value="Admin">Admin</option>
              <option value="Manager">Manager</option>
              <option value="HR">HR</option>
              <option value="Employee">Employee</option>
            </select>
          </div>
          
          <button type="submit" className="btn-primary">Login</button>
        </form>
        
        <div className="auth-footer">
          <p>Don't have an account? <Link to="/signup">Sign Up</Link></p>
        </div>
      </div>
    </div>
  );
}

export default Login;
