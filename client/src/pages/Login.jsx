import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || '/dashboard';

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      setError('Please provide both email and password.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const res = await login(formData.email, formData.password);
      if (res?.user?.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (type) => {
    if (type === 'admin') {
      setFormData({
        email: 'admin@schemesathi.gov.in',
        password: 'adminpassword123'
      });
    } else {
      setFormData({
        email: 'ananya.ramesh@college.edu',
        password: 'password123'
      });
    }
    setError('');
  };

  return (
    <div className="py-5 d-flex align-items-center" style={{ backgroundColor: 'var(--light-bg)', minHeight: '80vh' }}>
      <div className="container py-3">
        <div className="row justify-content-center">
          <div className="col-lg-5 col-md-8">
            <div className="card custom-card shadow-md border-0 overflow-hidden">
              <div className="card-header bg-navy text-white text-center p-4" style={{ backgroundColor: 'var(--primary-navy)' }}>
                <div
                  className="rounded-circle bg-white text-primary mx-auto mb-2 d-flex align-items-center justify-content-center"
                  style={{ width: '48px', height: '48px' }}
                >
                  <i className="bi bi-person-fill fs-3" style={{ color: 'var(--primary-navy)' }}></i>
                </div>
                <h4 className="fw-bold mb-1">Sign In</h4>
                <p className="text-light text-opacity-75 small mb-0">
                  Access your matched schemes and document alerts.
                </p>
              </div>

              <div className="card-body p-4 p-md-5">
                {error && (
                  <div className="alert alert-danger d-flex align-items-center gap-2 mb-4" role="alert">
                    <i className="bi bi-exclamation-triangle-fill flex-shrink-0"></i>
                    <div>{error}</div>
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Email Address</label>
                    <div className="input-group">
                      <span className="input-group-text bg-light text-muted">
                        <i className="bi bi-envelope"></i>
                      </span>
                      <input
                        type="email"
                        className="form-control"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="e.g. kavitha@college.edu"
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="form-label small fw-semibold">Password</label>
                    <div className="input-group">
                      <span className="input-group-text bg-light text-muted">
                        <i className="bi bi-lock"></i>
                      </span>
                      <input
                        type="password"
                        className="form-control"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Enter your password"
                        required
                      />
                    </div>
                  </div>

                  <div className="d-grid mb-3">
                    <button
                      type="submit"
                      className="btn btn-navy py-2 fw-semibold"
                      disabled={loading}
                    >
                      {loading ? 'Signing In...' : 'Sign In'}
                    </button>
                  </div>

                  {/* 1-Click Demo Login Helpers */}
                  <div className="p-3 bg-light rounded border mb-3">
                    <div className="fw-semibold small text-muted mb-2 text-center">
                      Quick Demo Login:
                    </div>
                    <div className="d-flex gap-2">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary flex-grow-1"
                        onClick={() => handleQuickFill('student')}
                      >
                        <i className="bi bi-mortarboard-fill me-1"></i> Demo Student
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger flex-grow-1"
                        onClick={() => handleQuickFill('admin')}
                      >
                        <i className="bi bi-shield-lock-fill me-1"></i> Admin
                      </button>
                    </div>
                  </div>

                  <div className="text-center small text-muted">
                    New to SchemeSathi?{' '}
                    <Link to="/register" className="text-primary fw-bold text-decoration-none">
                      Register
                    </Link>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
