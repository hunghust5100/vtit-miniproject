import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loginAPI } from '../services/auth';
import { Mail, Lock, Eye, EyeOff, ShieldAlert } from 'lucide-react';
import loginBg from '../assets/login_background.png';
import viettelLogo from '../assets/viettel_logo.png';
import './Login.css';

const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{ email?: string; password?: string }>({});

  const validateForm = (): boolean => {
    const errors: { email?: string; password?: string } = {};
    let isValid = true;

    if (!email) {
      errors.email = 'Vui lòng nhập email';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Email không hợp lệ';
      isValid = false;
    }

    if (!password) {
      errors.password = 'Vui lòng nhập mật khẩu';
      isValid = false;
    }

    setValidationErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await loginAPI({ email, password });
      
      // Store in auth context (token and user info)
      login(response.token, {
        email: response.email,
        fullName: response.fullName,
        role: response.role,
      });

      // RoleBasedRedirect in routes will automatically handle role routing,
      // but we can also manually navigate as a fallback.
      const role = response.role.replace(/^ROLE_/, '');
      if (role === 'ADMIN') {
        navigate('/admin');
      } else if (role === 'MANAGER') {
        navigate('/manager');
      } else {
        navigate('/user');
      }
    } catch (err: any) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Đăng nhập thất bại. Vui lòng kiểm tra lại kết nối!');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="login-container" 
      style={{ backgroundImage: `url(${loginBg})` }}
    >
      <div className="login-card">
        <div className="login-logo-container">
          <img src={viettelLogo} alt="Viettel Logo" className="login-logo" />
        </div>
        
        <h2 className="login-title">Đăng nhập</h2>
        <p className="login-subtitle">Nhập thông tin tài khoản email và mật khẩu</p>

        {error && (
          <div className="login-error-alert">
            <ShieldAlert size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          {/* Email/Tên đăng nhập */}
          <div className={`input-group ${validationErrors.email ? 'error' : ''}`}>
            <span className="input-icon">
              <Mail size={20} />
            </span>
            <input
              type="text"
              className="input-control"
              placeholder="Email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (validationErrors.email) setValidationErrors(prev => ({ ...prev, email: undefined }));
              }}
              disabled={loading}
            />
          </div>
          {validationErrors.email && (
            <span style={{ color: 'var(--error)', fontSize: '12px', margin: '-12px 0 12px 16px', textAlign: 'left' }}>
              {validationErrors.email}
            </span>
          )}

          {/* Mật khẩu */}
          <div className={`input-group ${validationErrors.password ? 'error' : ''}`}>
            <span className="input-icon">
              <Lock size={20} />
            </span>
            <input
              type={showPassword ? 'text' : 'password'}
              className="input-control"
              placeholder="Mật khẩu"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (validationErrors.password) setValidationErrors(prev => ({ ...prev, password: undefined }));
              }}
              disabled={loading}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              disabled={loading}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {validationErrors.password && (
            <span style={{ color: 'var(--error)', fontSize: '12px', margin: '-12px 0 12px 16px', textAlign: 'left' }}>
              {validationErrors.password}
            </span>
          )}

          <a href="#forgot" className="forgot-password-link">
            Quên mật khẩu?
          </a>

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? (
              <>
                <div className="spinner"></div>
                Đang đăng nhập...
              </>
            ) : (
              'Đăng nhập'
            )}
          </button>
        </form>

        <div className="sso-button-container">
          <button className="sso-button" onClick={() => alert('Đăng nhập SSO hiện chưa sẵn sàng!')}>
            <span className="sso-icon">
              <Lock size={16} />
            </span>
            Hoặc đăng nhập bằng tài khoản SSO
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
