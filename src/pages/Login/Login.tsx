import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../redux/hooks';
import { setUser } from '../../redux/authSlice';
import authService from '../../services/authService';
import { Button } from '../../components/Button/Button';
import { Input } from '../../components/Input/Input';
import { toast } from 'react-toastify';
import styles from './Login.module.css';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setLoading(true);

    try {
      const response = await authService.login({ email, password });
      dispatch(setUser(response.data.user));
      toast.success(`Welcome back, ${response.data.user.name}!`);
      navigate('/dashboard');
    } catch (err: any) {
      let errorMessage = 'Failed to login. Please check your credentials.';
      
      // Check for API configuration issues
      if (err.message?.includes('API Base URL is not configured')) {
        errorMessage = 'API server is not configured. Please contact the administrator.';
      } else if (err.response?.status === 404) {
        errorMessage = err.response?.data?.message || 'The login endpoint was not found. Please check your API configuration.';
      } else if (err.response?.status === 401) {
        errorMessage = 'Invalid email or password. Please try again.';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
      
      // Log detailed error in development
      if (import.meta.env.DEV) {
        console.error('Login error details:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginPage}>
      <div className={styles.loginCard}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}>🕌</div>
          <h1 className={styles.brandName}>Al-Asr Portal</h1>
          <p className={styles.subtitle}>Super Admin Dashboard</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          {error && <div className={styles.errorMessage}>{error}</div>}

          <Input
            label="Email"
            type="email"
            placeholder="admin@alasr.com"
            value={email}
            onChange={setEmail}
            required
            fullWidth
            icon={<span>📧</span>}
          />

          <Input
            label="Password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={setPassword}
            required
            fullWidth
            icon={<span>🔒</span>}
          />

          <label className={styles.rememberMe}>
            <input
              type="checkbox"
              className={styles.checkbox}
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            Remember me
          </label>

          <Button type="submit" fullWidth loading={loading} size="large">
            Login
          </Button>
        </form>

        <div className={styles.footer}>
          © 2025 Al-Asr Portal. All rights reserved.
        </div>
      </div>
    </div>
  );
};

