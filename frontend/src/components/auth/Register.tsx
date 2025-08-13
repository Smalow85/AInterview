import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './auth.scss';
import Loader from '../loader/Loader';

interface RegisterProps {
  onSwitchToLogin: () => void;
}

const Register: React.FC<RegisterProps> = ({ onSwitchToLogin }) => {

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    try {
      await register(email, password);
      navigate('/');
    } catch (err) {
      setError('Failed to register');
      console.log(error);
    } finally {

      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">Welcome to AInterview!</h1>
        <p className="auth-description-body">
          AInterview is an AI-powered platform that helps you practice for your next job interview. 
          You can answer technical questions, practice your soft skills, and get instant feedback on your performance.
        </p>
        <form onSubmit={handleRegister} className="auth-form">
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? <Loader /> : 'Register'}
          </button>
          {error && <p className="error-message">{error}</p>}
        </form>
        <div className="auth-switch">
          Already have an account? <button onClick={onSwitchToLogin} className="link-button">Login</button>
        </div>
      </div>
    </div>
  );
};

export default Register;
