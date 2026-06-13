import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch('https://employee-management-api-lf6s.onrender.com/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token, password })
      });
      const data = await response.json();
      if (response.ok) {
        setSuccess(data.message || 'Password reset successful!');
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setError(data.error || 'Failed to reset password.');
      }
    } catch (err) {
      setError('Failed to connect to the server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Create New Password</h2>
          <p>Employee Central</p>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && (
          <div className="success-message" style={{ color: '#28a745', backgroundColor: '#e8f5e9', padding: '10px', borderRadius: '4px', marginBottom: '15px', fontSize: '13px' }}>
            {success} Redirecting to login...
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>New Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              placeholder="••••••" 
              required 
              disabled={loading || !!success}
            />
          </div>

          <div className="form-group">
            <label>Confirm Password</label>
            <input 
              type="password" 
              value={confirmPassword} 
              onChange={e => setConfirmPassword(e.target.value)} 
              placeholder="••••••" 
              required 
              disabled={loading || !!success}
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading || !!success}>
            {loading ? 'Updating Password...' : 'Reset Password'}
          </button>
        </form>

        <div className="auth-footer" style={{ marginTop: '20px' }}>
          <button 
            type="button" 
            onClick={() => navigate('/login')} 
            style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}
          >
            Cancel and Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
