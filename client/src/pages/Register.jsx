import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    collegeName: '',
    course: '',
    studyYear: '1',
    state: 'Tamil Nadu'
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const indianStates = [
    'Tamil Nadu',
    'Andhra Pradesh',
    'Telangana',
    'Karnataka',
    'Kerala',
    'Maharashtra',
    'Delhi',
    'Uttar Pradesh',
    'West Bengal',
    'Gujarat',
    'Rajasthan',
    'Madhya Pradesh',
    'Bihar',
    'Assam',
    'Punjab',
    'Haryana',
    'Odisha',
    'Other State / UT'
  ];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.password) {
      setError('Please fill in all mandatory account fields.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match. Please verify.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await register(formData);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-5" style={{ backgroundColor: 'var(--light-bg)', minHeight: '85vh' }}>
      <div className="container py-3">
        <div className="row justify-content-center">
          <div className="col-lg-8 col-md-10">
            <div className="card custom-card shadow-md border-0 overflow-hidden">
              <div className="card-header bg-navy text-white p-4" style={{ backgroundColor: 'var(--primary-navy)' }}>
                <div className="d-flex align-items-center gap-3">
                  <div className="rounded-circle bg-white text-primary p-2 d-flex align-items-center justify-content-center" style={{ width: '45px', height: '45px' }}>
                    <i className="bi bi-mortarboard-fill fs-4" style={{ color: 'var(--primary-navy)' }}></i>
                  </div>
                  <div>
                    <h4 className="fw-bold mb-1">Register</h4>
                    <p className="text-light text-opacity-75 small mb-0">
                      Create an account to discover scholarships and track document expiry.
                    </p>
                  </div>
                </div>
              </div>

              <div className="card-body p-4 p-md-5">
                {error && (
                  <div className="alert alert-danger d-flex align-items-center gap-2 mb-4" role="alert">
                    <i className="bi bi-exclamation-triangle-fill flex-shrink-0"></i>
                    <div>{error}</div>
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="mb-4">
                    <h6 className="fw-bold text-navy pb-2 border-bottom" style={{ color: 'var(--primary-navy)' }}>
                      1. Account Details
                    </h6>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label small fw-semibold">
                          Full Name <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="e.g. Kavitha Sundaram"
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label small fw-semibold">
                          College / Personal Email <span className="text-danger">*</span>
                        </label>
                        <input
                          type="email"
                          className="form-control"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="e.g. student@college.edu or gmail"
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label small fw-semibold">
                          Password (min 6 chars) <span className="text-danger">*</span>
                        </label>
                        <input
                          type="password"
                          className="form-control"
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          placeholder="Create strong password"
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label small fw-semibold">
                          Confirm Password <span className="text-danger">*</span>
                        </label>
                        <input
                          type="password"
                          className="form-control"
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          placeholder="Repeat password"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <h6 className="fw-bold text-navy pb-2 border-bottom" style={{ color: 'var(--primary-navy)' }}>
                      2. Academic Details
                    </h6>
                    <div className="row g-3">
                      <div className="col-md-12">
                        <label className="form-label small fw-semibold">
                          College / University Name
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          name="collegeName"
                          value={formData.collegeName}
                          onChange={handleChange}
                          placeholder="e.g. Government College of Technology, Coimbatore"
                        />
                      </div>
                      <div className="col-md-5">
                        <label className="form-label small fw-semibold">Degree / Course Name</label>
                        <input
                          type="text"
                          className="form-control"
                          name="course"
                          value={formData.course}
                          onChange={handleChange}
                          placeholder="e.g. B.E. Computer Science, B.Com, B.Sc"
                        />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label small fw-semibold">Year of Study</label>
                        <select
                          className="form-select"
                          name="studyYear"
                          value={formData.studyYear}
                          onChange={handleChange}
                        >
                          <option value="1">1st Year</option>
                          <option value="2">2nd Year</option>
                          <option value="3">3rd Year</option>
                          <option value="4">4th Year</option>
                          <option value="5">5th Year</option>
                        </select>
                      </div>
                      <div className="col-md-4">
                        <label className="form-label small fw-semibold">State of Domicile</label>
                        <select
                          className="form-select"
                          name="state"
                          value={formData.state}
                          onChange={handleChange}
                        >
                          {indianStates.map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-light rounded border mb-4 text-muted small d-flex align-items-center gap-2">
                    <i className="bi bi-shield-check text-success fs-5"></i>
                    <span>
                      <strong>Zero-Storage:</strong> We never collect Aadhaar numbers or original certificate files.
                    </span>
                  </div>

                  <div className="d-grid mb-3">
                    <button
                      type="submit"
                      className="btn btn-navy py-2 fw-semibold"
                      disabled={loading}
                    >
                      {loading ? 'Registering...' : 'Register'}
                    </button>
                  </div>

                  <div className="text-center small text-muted">
                    Already registered?{' '}
                    <Link to="/login" className="text-primary fw-bold text-decoration-none">
                      Sign In
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

export default Register;
