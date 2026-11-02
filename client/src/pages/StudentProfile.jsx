import React, { useState, useEffect } from 'react';
import { profileAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import LoadingSpinner from '../components/LoadingSpinner';

const StudentProfile = () => {
  const { updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [formData, setFormData] = useState({
    fullName: '',
    dateOfBirth: '',
    age: '',
    gender: '',
    state: '',
    district: '',
    category: '',
    collegeName: '',
    collegeType: '',
    university: '',
    course: '',
    degreeType: 'Undergraduate',
    studyYear: 1,
    admissionYear: new Date().getFullYear(),
    academicPercentage: '',
    collegeRecognized: true,
    annualFamilyIncome: '',
    incomeCategory: '',
    scholarshipReceiving: false,
    additionalEligibilityInformation: {
      isPersonWithDisability: false,
      disabilityPercentage: 0,
      isSingleGirlChild: false,
      isHosteler: false,
      isFirstGraduate: false,
      isGovernmentSchoolStudent: false
    }
  });

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

  const categories = ['General', 'OBC', 'SC', 'ST', 'EWS', 'BC', 'MBC', 'DNC', 'Minority', 'Other'];

  const collegeTypes = [
    'Government College',
    'Government-Aided College',
    'Private / Self-Financing',
    'Autonomous Institution',
    'Central University',
    'State University Campus',
    'Deemed University',
    'Other'
  ];

  const degreeTypes = ['Undergraduate', 'Postgraduate', 'Diploma', 'Doctorate', 'Integrated Master', 'Other'];

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await profileAPI.getProfile();
        if (res.profile) {
          setProfile(res.profile);
          setFormData({
            fullName: res.profile.fullName || '',
            dateOfBirth: res.profile.dateOfBirth ? res.profile.dateOfBirth.split('T')[0] : '',
            age: res.profile.age !== null && res.profile.age !== undefined ? res.profile.age : '',
            gender: res.profile.gender || '',
            state: res.profile.state || '',
            district: res.profile.district || '',
            category: res.profile.category || '',
            collegeName: res.profile.collegeName || '',
            collegeType: res.profile.collegeType || '',
            university: res.profile.university || '',
            course: res.profile.course || '',
            degreeType: res.profile.degreeType || 'Undergraduate',
            studyYear: res.profile.studyYear || 1,
            admissionYear: res.profile.admissionYear || new Date().getFullYear(),
            academicPercentage: res.profile.academicPercentage !== null && res.profile.academicPercentage !== undefined ? res.profile.academicPercentage : '',
            collegeRecognized: res.profile.collegeRecognized !== undefined ? res.profile.collegeRecognized : true,
            annualFamilyIncome: res.profile.annualFamilyIncome !== null && res.profile.annualFamilyIncome !== undefined ? res.profile.annualFamilyIncome : '',
            incomeCategory: res.profile.incomeCategory || '',
            scholarshipReceiving: res.profile.scholarshipReceiving || false,
            additionalEligibilityInformation: {
              isPersonWithDisability: res.profile.additionalEligibilityInformation?.isPersonWithDisability || false,
              disabilityPercentage: res.profile.additionalEligibilityInformation?.disabilityPercentage || 0,
              isSingleGirlChild: res.profile.additionalEligibilityInformation?.isSingleGirlChild || false,
              isHosteler: res.profile.additionalEligibilityInformation?.isHosteler || false,
              isFirstGraduate: res.profile.additionalEligibilityInformation?.isFirstGraduate || false,
              isGovernmentSchoolStudent: res.profile.additionalEligibilityInformation?.isGovernmentSchoolStudent || false
            }
          });
        }
      } catch (err) {
        console.error(err);
        setMessage({ type: 'danger', text: 'Failed to load profile details.' });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAdditionalChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      additionalEligibilityInformation: {
        ...prev.additionalEligibilityInformation,
        [name]: type === 'checkbox' ? checked : value
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (formData.academicPercentage !== '') {
      const pct = Number(formData.academicPercentage);
      if (isNaN(pct) || pct < 0 || pct > 100) {
        setMessage({ type: 'danger', text: 'Academic percentage must be a number between 0 and 100.' });
        return;
      }
    }

    if (formData.annualFamilyIncome !== '') {
      const inc = Number(formData.annualFamilyIncome);
      if (isNaN(inc) || inc < 0) {
        setMessage({ type: 'danger', text: 'Annual family income must be a valid positive amount.' });
        return;
      }
    }

    try {
      setSaving(true);
      const res = await profileAPI.updateProfile(formData);
      setMessage({ type: 'success', text: res.message || 'Profile saved and eligibility rules updated successfully!' });
      if (res.profile) {
        setProfile(res.profile);
        updateUser({
          name: res.profile.fullName,
          state: res.profile.state,
          collegeName: res.profile.collegeName,
          course: res.profile.course,
          studyYear: res.profile.studyYear
        });
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setMessage({ type: 'danger', text: err.message || 'Failed to update student profile.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="dashboard-main">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h3 className="fw-bold text-navy mb-1" style={{ color: 'var(--primary-navy)' }}>
              Student Profile
            </h3>
            <p className="text-muted small mb-0">
              Keep your profile updated for accurate scholarship matching.
            </p>
          </div>
        </div>

        {message.text && (
          <div className={`alert alert-${message.type} alert-dismissible fade show`} role="alert">
            <i className={`bi ${message.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'} me-2`}></i>
            {message.text}
            <button type="button" className="btn-close" onClick={() => setMessage({ type: '', text: '' })}></button>
          </div>
        )}

        {loading ? (
          <LoadingSpinner message="Retrieving your profile..." />
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Section 1: Personal Information */}
            <div className="card custom-card shadow-sm mb-4">
              <div className="card-header bg-white py-3 border-bottom">
                <h6 className="fw-bold text-navy mb-0" style={{ color: 'var(--primary-navy)' }}>
                  <i className="bi bi-person-lines-fill me-2 text-primary"></i> 1. Personal Details
                </h6>
              </div>
              <div className="card-body p-4">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold">Full Name</label>
                    <input
                      type="text"
                      className="form-control"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      placeholder="e.g. Kavitha S"
                      required
                    />
                  </div>

                  <div className="col-md-3">
                    <label className="form-label small fw-semibold">Date of Birth</label>
                    <input
                      type="date"
                      className="form-control"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-md-3">
                    <label className="form-label small fw-semibold">Gender</label>
                    <select
                      className="form-select"
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                    >
                      <option value="">Select Gender</option>
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                      <option value="Transgender">Transgender</option>
                      <option value="Other">Other</option>
                      <option value="Prefer not to say">Prefer not to say</option>
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
                      <option value="">Select State</option>
                      {indianStates.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-4">
                    <label className="form-label small fw-semibold">District</label>
                    <input
                      type="text"
                      className="form-control"
                      name="district"
                      value={formData.district}
                      onChange={handleChange}
                      placeholder="e.g. Coimbatore, Chennai, Madurai"
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label small fw-semibold">Social Category</label>
                    <select
                      className="form-select"
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                    >
                      <option value="">Select Category</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Academic Information */}
            <div className="card custom-card shadow-sm mb-4">
              <div className="card-header bg-white py-3 border-bottom">
                <h6 className="fw-bold text-navy mb-0" style={{ color: 'var(--primary-navy)' }}>
                  <i className="bi bi-mortarboard-fill me-2 text-primary"></i> 2. Academic Details
                </h6>
              </div>
              <div className="card-body p-4">
                <div className="row g-3">
                  <div className="col-md-8">
                    <label className="form-label small fw-semibold">College / Institute Name</label>
                    <input
                      type="text"
                      className="form-control"
                      name="collegeName"
                      value={formData.collegeName}
                      onChange={handleChange}
                      placeholder="e.g. Government College of Technology, Coimbatore"
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label small fw-semibold">College Type</label>
                    <select
                      className="form-select"
                      name="collegeType"
                      value={formData.collegeType}
                      onChange={handleChange}
                    >
                      <option value="">Select Type</option>
                      {collegeTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label small fw-semibold">Affiliated University</label>
                    <input
                      type="text"
                      className="form-control"
                      name="university"
                      value={formData.university}
                      onChange={handleChange}
                      placeholder="e.g. Anna University, Madras University, Bharathiar University"
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label small fw-semibold">Degree / Program Type</label>
                    <select
                      className="form-select"
                      name="degreeType"
                      value={formData.degreeType}
                      onChange={handleChange}
                    >
                      {degreeTypes.map((deg) => (
                        <option key={deg} value={deg}>
                          {deg}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-4">
                    <label className="form-label small fw-semibold">Course Name</label>
                    <input
                      type="text"
                      className="form-control"
                      name="course"
                      value={formData.course}
                      onChange={handleChange}
                      placeholder="e.g. B.E. Computer Science, B.Tech, B.Com"
                    />
                  </div>

                  <div className="col-md-2">
                    <label className="form-label small fw-semibold">Current Year</label>
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

                  <div className="col-md-3">
                    <label className="form-label small fw-semibold">Admission Year</label>
                    <input
                      type="number"
                      className="form-control"
                      name="admissionYear"
                      value={formData.admissionYear}
                      onChange={handleChange}
                      min="2018"
                      max="2030"
                    />
                  </div>

                  <div className="col-md-3">
                    <label className="form-label small fw-semibold">
                      Academic Percentage / Marks (%)
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      name="academicPercentage"
                      value={formData.academicPercentage}
                      onChange={handleChange}
                      placeholder="e.g. 85.5"
                      min="0"
                      max="100"
                      step="0.01"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Financial Information */}
            <div className="card custom-card shadow-sm mb-4">
              <div className="card-header bg-white py-3 border-bottom">
                <h6 className="fw-bold text-navy mb-0" style={{ color: 'var(--primary-navy)' }}>
                  <i className="bi bi-cash-stack me-2 text-primary"></i> 3. Financial Details
                </h6>
              </div>
              <div className="card-body p-4">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold">
                      Annual Family Income (₹) <span className="text-danger">*</span>
                    </label>
                    <div className="input-group">
                      <span className="input-group-text">₹</span>
                      <input
                        type="number"
                        className="form-control"
                        name="annualFamilyIncome"
                        value={formData.annualFamilyIncome}
                        onChange={handleChange}
                        placeholder="e.g. 150000"
                        min="0"
                      />
                    </div>
                    <div className="form-text small">
                      As per your revenue income certificate.
                    </div>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label small fw-semibold">Income Category</label>
                    <select
                      className="form-select"
                      name="incomeCategory"
                      value={formData.incomeCategory}
                      onChange={handleChange}
                    >
                      <option value="">Select Range</option>
                      <option value="Below ₹1,00,000">Below ₹1,00,000</option>
                      <option value="₹1,00,000 - ₹2,50,000">₹1,00,000 - ₹2,50,000</option>
                      <option value="₹2,50,000 - ₹4,50,000">₹2,50,000 - ₹4,50,000</option>
                      <option value="₹4,50,000 - ₹8,00,000">₹4,50,000 - ₹8,00,000</option>
                      <option value="Above ₹8,00,000">Above ₹8,00,000</option>
                    </select>
                  </div>

                  <div className="col-12 mt-3">
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="scholarshipReceiving"
                        name="scholarshipReceiving"
                        checked={formData.scholarshipReceiving}
                        onChange={handleChange}
                      />
                      <label className="form-check-label fw-semibold" htmlFor="scholarshipReceiving">
                        Currently receiving another government scholarship
                      </label>
                    </div>
                    <div className="form-text small text-muted">
                      Some schemes prohibit dual scholarships.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 4: Scheme-Specific Eligibility Attributes */}
            <div className="card custom-card shadow-sm mb-4">
              <div className="card-header bg-white py-3 border-bottom">
                <h6 className="fw-bold text-navy mb-0" style={{ color: 'var(--primary-navy)' }}>
                  <i className="bi bi-ui-checks me-2 text-primary"></i> 4. Special Categories
                </h6>
              </div>
              <div className="card-body p-4">
                <div className="row g-3">
                  <div className="col-md-6">
                    <div className="form-check form-switch mb-2">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="isGovernmentSchoolStudent"
                        name="isGovernmentSchoolStudent"
                        checked={formData.additionalEligibilityInformation.isGovernmentSchoolStudent}
                        onChange={handleAdditionalChange}
                      />
                      <label className="form-check-label fw-semibold" htmlFor="isGovernmentSchoolStudent">
                        Studied in Government School (Classes 6–12)
                      </label>
                    </div>
                    <div className="text-muted small">
                      For TN Puthumai Penn and 7.5% quota.
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="form-check form-switch mb-2">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="isSingleGirlChild"
                        name="isSingleGirlChild"
                        checked={formData.additionalEligibilityInformation.isSingleGirlChild}
                        onChange={handleAdditionalChange}
                      />
                      <label className="form-check-label fw-semibold" htmlFor="isSingleGirlChild">
                        Single Girl Child in Family
                      </label>
                    </div>
                    <div className="text-muted small">
                      For UGC / AICTE single girl child schemes.
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="form-check form-switch mb-2">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="isPersonWithDisability"
                        name="isPersonWithDisability"
                        checked={formData.additionalEligibilityInformation.isPersonWithDisability}
                        onChange={handleAdditionalChange}
                      />
                      <label className="form-check-label fw-semibold" htmlFor="isPersonWithDisability">
                        Person with Benchmark Disability (PwD &ge; 40%)
                      </label>
                    </div>
                    <div className="text-muted small">
                      For Saksham and National PwD schemes.
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="form-check form-switch mb-2">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="isHosteler"
                        name="isHosteler"
                        checked={formData.additionalEligibilityInformation.isHosteler}
                        onChange={handleAdditionalChange}
                      />
                      <label className="form-check-label fw-semibold" htmlFor="isHosteler">
                        College Hosteller
                      </label>
                    </div>
                    <div className="text-muted small">
                      For hosteller maintenance allowances.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="d-flex justify-content-end mb-5">
              <button
                type="submit"
                className="btn btn-navy px-4 py-2 fw-semibold"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Saving...
                  </>
                ) : (
                  <>
                    <i className="bi bi-save me-2"></i> Save Profile
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
};

export default StudentProfile;
