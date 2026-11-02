import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { adminAPI, schemeAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import SchemeVerificationBadge from '../components/SchemeVerificationBadge';

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active tab derived from URL query string
  const activeTab = searchParams.get('tab') || 'DASHBOARD';
  const paramEditId = searchParams.get('edit');
  const paramSchemeId = searchParams.get('schemeId');

  const [metrics, setMetrics] = useState(null);
  const [schemes, setSchemes] = useState([]);
  const [students, setStudents] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMsg, setActionMsg] = useState({ type: '', text: '' });

  // Scheme Modal State
  const [showSchemeModal, setShowSchemeModal] = useState(false);
  const [modalMode, setModalMode] = useState('CREATE'); // 'CREATE' or 'EDIT'
  const [selectedSchemeId, setSelectedSchemeId] = useState(null);
  const [schemeForm, setSchemeForm] = useState({
    name: '',
    category: 'Merit-based',
    ministry: '',
    description: '',
    detailedDescription: '',
    applicableStates: 'All India',
    educationLevels: 'Undergraduate',
    benefits: '',
    requiredDocuments: '',
    applicationDeadline: '',
    applicationStatus: 'Open',
    officialUrl: ''
  });

  // Rules Editor State
  const [selectedRuleSchemeId, setSelectedRuleSchemeId] = useState('');
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [ruleEditIndex, setRuleEditIndex] = useState(null);
  const [ruleForm, setRuleForm] = useState({
    field: 'annualFamilyIncome',
    label: 'Annual Family Income Limit',
    operator: 'lte',
    value: '250000',
    mandatory: true,
    explanationOnFail: 'Family income exceeds maximum threshold.'
  });

  // Verification Modal State
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyScheme, setVerifyScheme] = useState(null);
  const [verifyForm, setVerifyForm] = useState({
    verificationStatus: 'Verified',
    officialUrl: '',
    lastVerified: new Date().toISOString().split('T')[0]
  });

  // Announcement Modal State
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [announcementMode, setAnnouncementMode] = useState('CREATE');
  const [selectedAnnouncementId, setSelectedAnnouncementId] = useState(null);
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    content: '',
    category: 'General',
    isPublished: true
  });

  // Filters & Search
  const [schemeSearch, setSchemeSearch] = useState('');
  const [schemeCategoryFilter, setSchemeCategoryFilter] = useState('All');
  const [studentSearch, setStudentSearch] = useState('');

  const categories = [
    'Merit-based',
    'Income-based',
    'Community-based',
    'Minority Welfare',
    'Technical Education',
    'Higher Education Assistance',
    'Disability Support',
    'State Government Welfare',
    'Girls & Women Education'
  ];

  const ruleFieldPresets = [
    { field: 'annualFamilyIncome', label: 'Annual Family Income Limit', operator: 'lte', defaultValue: '250000' },
    { field: 'academicPercentage', label: 'Minimum Qualifying Academic %', operator: 'gte', defaultValue: '60' },
    { field: 'gender', label: 'Eligible Gender', operator: 'eq', defaultValue: 'Female' },
    { field: 'category', label: 'Applicable Social Category', operator: 'in', defaultValue: 'SC, ST, BC, MBC' },
    { field: 'state', label: 'Domicile State Requirement', operator: 'in', defaultValue: 'Tamil Nadu, All India' },
    { field: 'isSingleGirlChild', label: 'Single Girl Child Requirement', operator: 'boolean_eq', defaultValue: 'true' },
    { field: 'isPersonWithDisability', label: 'Person with Disability', operator: 'boolean_eq', defaultValue: 'true' },
    { field: 'isFirstGraduate', label: 'First Graduate in Family', operator: 'boolean_eq', defaultValue: 'true' }
  ];

  const setTab = (tab) => {
    setSearchParams({ tab });
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const [metricsRes, schemesRes, studentsRes, annRes] = await Promise.all([
        adminAPI.getMetrics(),
        schemeAPI.getSchemes({ limit: 100 }),
        adminAPI.getStudents(),
        adminAPI.getAnnouncements().catch(() => ({ announcements: [] }))
      ]);
      setMetrics(metricsRes.metrics || {});
      setSchemes(schemesRes.schemes || []);
      setStudents(studentsRes.students || []);
      setAnnouncements(annRes.announcements || []);

      if (schemesRes.schemes?.length > 0 && !selectedRuleSchemeId) {
        setSelectedRuleSchemeId(paramSchemeId || schemesRes.schemes[0]._id);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load administration data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle URL deep-linking (e.g. edit scheme or manage rules for a scheme)
  useEffect(() => {
    if (paramEditId && schemes.length > 0) {
      const found = schemes.find((s) => s._id === paramEditId);
      if (found) {
        openEditModal(found);
      }
    }
    if (paramSchemeId && schemes.length > 0) {
      setSelectedRuleSchemeId(paramSchemeId);
    }
  }, [paramEditId, paramSchemeId, schemes]);

  // Prevent background scrolling while any modal is open, and restore when closed
  useEffect(() => {
    const isAnyModalOpen = showSchemeModal || showRuleModal || showVerifyModal || showAnnouncementModal;
    if (isAnyModalOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [showSchemeModal, showRuleModal, showVerifyModal, showAnnouncementModal]);

  // Support closing scheme modal with Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && showSchemeModal) {
        setShowSchemeModal(false);
      }
    };
    if (showSchemeModal) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [showSchemeModal]);


  // --- SCHEME MODAL HANDLERS ---
  const openCreateModal = () => {
    setModalMode('CREATE');
    setSelectedSchemeId(null);
    setSchemeForm({
      name: '',
      category: 'Merit-based',
      ministry: '',
      description: '',
      detailedDescription: '',
      applicableStates: 'All India',
      educationLevels: 'Undergraduate',
      benefits: '',
      requiredDocuments: '',
      applicationDeadline: '',
      applicationStatus: 'Open',
      officialUrl: ''
    });
    setShowSchemeModal(true);
  };

  const openEditModal = (scheme) => {
    setModalMode('EDIT');
    setSelectedSchemeId(scheme._id);
    setSchemeForm({
      name: scheme.name,
      category: scheme.category,
      ministry: scheme.ministry || '',
      description: scheme.description || '',
      detailedDescription: scheme.detailedDescription || '',
      applicableStates: scheme.applicableStates?.join(', ') || 'All India',
      educationLevels: scheme.educationLevels?.[0] || 'Undergraduate',
      benefits: scheme.benefits?.join('\n') || '',
      requiredDocuments: scheme.requiredDocuments?.join('\n') || '',
      applicationDeadline: scheme.applicationDeadline || '',
      applicationStatus: scheme.applicationStatus || 'Open',
      officialUrl: scheme.officialUrl || ''
    });
    setShowSchemeModal(true);
  };

  const handleSchemeSubmit = async (e) => {
    e.preventDefault();
    if (!schemeForm.name || !schemeForm.description || !schemeForm.officialUrl) {
      alert('Please fill out scheme name, short description, and official portal URL.');
      return;
    }

    const payload = {
      ...schemeForm,
      applicableStates: schemeForm.applicableStates.split(',').map((s) => s.trim()).filter(Boolean),
      educationLevels: [schemeForm.educationLevels],
      benefits: schemeForm.benefits.split('\n').map((b) => b.trim()).filter(Boolean),
      requiredDocuments: schemeForm.requiredDocuments.split('\n').map((d) => d.trim()).filter(Boolean)
    };

    try {
      if (modalMode === 'CREATE') {
        await adminAPI.createScheme(payload);
        setActionMsg({ type: 'success', text: `Scheme "${schemeForm.name}" created successfully!` });
      } else {
        await adminAPI.updateScheme(selectedSchemeId, payload);
        setActionMsg({ type: 'success', text: `Scheme "${schemeForm.name}" updated successfully!` });
      }
      setShowSchemeModal(false);
      loadData();
    } catch (err) {
      alert(err.message || 'Operation failed.');
    }
  };

  const handleDeleteScheme = async (id, name) => {
    if (!window.confirm(`Are you sure you want to permanently delete the scheme "${name}"?`)) {
      return;
    }
    try {
      await adminAPI.deleteScheme(id);
      setActionMsg({ type: 'success', text: `Scheme "${name}" deleted.` });
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to delete scheme.');
    }
  };

  // --- STUDENT STATUS HANDLER ---
  const handleToggleStudentStatus = async (student) => {
    const newStatus = !student.isActive;
    const actionText = newStatus ? 'activate' : 'deactivate';
    if (!window.confirm(`Are you sure you want to ${actionText} the student account for ${student.name}?`)) {
      return;
    }

    try {
      await adminAPI.toggleStudentStatus(student._id, newStatus);
      setActionMsg({
        type: 'success',
        text: `Student "${student.name}" account successfully ${newStatus ? 'activated' : 'deactivated'}.`
      });
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to update student status.');
    }
  };

  // --- ELIGIBILITY RULES HANDLERS ---
  const currentRuleScheme = schemes.find((s) => s._id === selectedRuleSchemeId);

  const openAddRuleModal = () => {
    setRuleEditIndex(null);
    setRuleForm({
      field: 'annualFamilyIncome',
      label: 'Annual Family Income Limit',
      operator: 'lte',
      value: '250000',
      mandatory: true,
      explanationOnFail: 'Family income exceeds maximum threshold.'
    });
    setShowRuleModal(true);
  };

  const openEditRuleModal = (rule, index) => {
    setRuleEditIndex(index);
    let valStr = rule.value;
    if (Array.isArray(rule.value)) valStr = rule.value.join(', ');
    else if (typeof rule.value === 'boolean') valStr = rule.value ? 'true' : 'false';

    setRuleForm({
      field: rule.field,
      label: rule.label,
      operator: rule.operator,
      value: valStr,
      mandatory: !!rule.mandatory,
      explanationOnFail: rule.explanationOnFail || ''
    });
    setShowRuleModal(true);
  };

  const handleRulePresetSelect = (presetField) => {
    const preset = ruleFieldPresets.find((p) => p.field === presetField);
    if (preset) {
      setRuleForm((prev) => ({
        ...prev,
        field: preset.field,
        label: preset.label,
        operator: preset.operator,
        value: preset.defaultValue,
        explanationOnFail: `${preset.label} condition not satisfied.`
      }));
    }
  };

  const handleSaveRule = async (e) => {
    e.preventDefault();
    if (!currentRuleScheme) return;

    let parsedVal = ruleForm.value;
    if (ruleForm.operator === 'lte' || ruleForm.operator === 'gte') {
      parsedVal = Number(ruleForm.value);
    } else if (ruleForm.operator === 'boolean_eq') {
      parsedVal = ruleForm.value === 'true';
    } else if (ruleForm.operator === 'in' || ruleForm.operator === 'nin') {
      parsedVal = ruleForm.value.split(',').map((s) => s.trim()).filter(Boolean);
    }

    const newRuleObj = {
      field: ruleForm.field,
      label: ruleForm.label.trim(),
      operator: ruleForm.operator,
      value: parsedVal,
      mandatory: ruleForm.mandatory,
      explanationOnFail: ruleForm.explanationOnFail.trim()
    };

    const currentRules = [...(currentRuleScheme.eligibilityRules || [])];
    if (ruleEditIndex !== null) {
      currentRules[ruleEditIndex] = newRuleObj;
    } else {
      currentRules.push(newRuleObj);
    }

    try {
      await adminAPI.updateEligibilityRules(currentRuleScheme._id, currentRules);
      setActionMsg({
        type: 'success',
        text: `Eligibility conditions updated for "${currentRuleScheme.name}". Eligibility engine updated.`
      });
      setShowRuleModal(false);
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to update eligibility rules.');
    }
  };

  const handleDeleteRule = async (index) => {
    if (!currentRuleScheme) return;
    if (!window.confirm('Are you sure you want to remove this eligibility condition rule?')) {
      return;
    }
    const currentRules = (currentRuleScheme.eligibilityRules || []).filter((_, i) => i !== index);
    try {
      await adminAPI.updateEligibilityRules(currentRuleScheme._id, currentRules);
      setActionMsg({ type: 'success', text: 'Condition rule removed. Eligibility engine updated.' });
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to remove rule.');
    }
  };

  // --- SCHEME VERIFICATION HANDLERS ---
  const openVerifyModal = (scheme) => {
    let currentStatus = scheme.verificationStatus || 'Needs Verification';
    if (currentStatus === 'Verified Active') currentStatus = 'Verified';
    if (currentStatus === 'Needs Official Verification') currentStatus = 'Needs Verification';

    setVerifyScheme(scheme);
    setVerifyForm({
      verificationStatus: currentStatus,
      officialUrl: scheme.officialUrl || '',
      lastVerified: new Date().toISOString().split('T')[0]
    });
    setShowVerifyModal(true);
  };

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    if (!verifyScheme) return;
    try {
      const res = await adminAPI.updateVerification(verifyScheme._id, verifyForm);
      const updatedStatus = res.scheme?.verificationStatus || verifyForm.verificationStatus;
      setActionMsg({
        type: 'success',
        text: `Verification status for "${verifyScheme.name}" set to "${updatedStatus}".`
      });
      setSchemes((prev) =>
        prev.map((s) => (s._id === verifyScheme._id ? { ...s, ...res.scheme } : s))
      );
      setShowVerifyModal(false);
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to update verification.');
    }
  };

  // --- ANNOUNCEMENT HANDLERS ---
  const openCreateAnnouncement = () => {
    setAnnouncementMode('CREATE');
    setSelectedAnnouncementId(null);
    setAnnouncementForm({
      title: '',
      content: '',
      message: '',
      category: 'General',
      publicationStatus: 'Published',
      isPublished: true
    });
    setShowAnnouncementModal(true);
  };

  const openEditAnnouncement = (ann) => {
    setAnnouncementMode('EDIT');
    setSelectedAnnouncementId(ann._id);
    const status = ann.publicationStatus || (ann.isPublished ? 'Published' : 'Draft');
    setAnnouncementForm({
      title: ann.title,
      content: ann.content || ann.message || '',
      message: ann.content || ann.message || '',
      category: ann.category || 'General',
      publicationStatus: status,
      isPublished: status === 'Published'
    });
    setShowAnnouncementModal(true);
  };

  const handleTogglePublishAnnouncement = async (ann) => {
    try {
      const currentStatus = ann.publicationStatus || (ann.isPublished ? 'Published' : 'Draft');
      const nextStatus = currentStatus === 'Published' ? 'Unpublished' : 'Published';
      const res = await adminAPI.updateAnnouncement(ann._id, {
        publicationStatus: nextStatus,
        isPublished: nextStatus === 'Published'
      });
      setActionMsg({
        type: 'success',
        text: `Announcement "${ann.title}" is now ${nextStatus}.`
      });
      setAnnouncements((prev) =>
        prev.map((a) => (a._id === ann._id ? { ...a, ...res.announcement } : a))
      );
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to update announcement status.');
    }
  };

  const handleAnnouncementSubmit = async (e) => {
    e.preventDefault();
    const content = (announcementForm.content || announcementForm.message || '').trim();
    if (!announcementForm.title.trim() || !content) {
      alert('Please fill out announcement title and content/message.');
      return;
    }

    try {
      const payload = {
        title: announcementForm.title.trim(),
        content,
        message: content,
        category: announcementForm.category,
        publicationStatus: announcementForm.publicationStatus || (announcementForm.isPublished ? 'Published' : 'Draft'),
        isPublished: (announcementForm.publicationStatus || (announcementForm.isPublished ? 'Published' : 'Draft')) === 'Published'
      };

      if (announcementMode === 'CREATE') {
        const res = await adminAPI.createAnnouncement(payload);
        setActionMsg({ type: 'success', text: 'Announcement created successfully.' });
        if (res.announcement) {
          setAnnouncements((prev) => [res.announcement, ...prev]);
        }
      } else {
        const res = await adminAPI.updateAnnouncement(selectedAnnouncementId, payload);
        setActionMsg({ type: 'success', text: 'Announcement updated successfully.' });
        if (res.announcement) {
          setAnnouncements((prev) =>
            prev.map((a) => (a._id === selectedAnnouncementId ? { ...a, ...res.announcement } : a))
          );
        }
      }
      setShowAnnouncementModal(false);
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to save announcement.');
    }
  };

  const handleDeleteAnnouncement = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) {
      return;
    }
    try {
      await adminAPI.deleteAnnouncement(id);
      setActionMsg({ type: 'success', text: 'Announcement deleted.' });
      setAnnouncements((prev) => prev.filter((a) => a._id !== id));
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to delete announcement.');
    }
  };

  // Filter schemes
  const filteredSchemes = schemes.filter((s) => {
    const matchesSearch =
      !schemeSearch.trim() ||
      s.name.toLowerCase().includes(schemeSearch.toLowerCase()) ||
      s.ministry?.toLowerCase().includes(schemeSearch.toLowerCase());
    const matchesCategory =
      schemeCategoryFilter === 'All' || s.category === schemeCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Filter students
  const filteredStudents = students.filter((stu) => {
    if (!studentSearch.trim()) return true;
    const term = studentSearch.toLowerCase();
    return (
      stu.name?.toLowerCase().includes(term) ||
      stu.email?.toLowerCase().includes(term) ||
      stu.collegeName?.toLowerCase().includes(term) ||
      stu.course?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="py-4" style={{ backgroundColor: 'var(--light-bg)', minHeight: '90vh' }}>
      <div className="container-fluid px-3 px-lg-4">
        {/* Top Header */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <span className="badge bg-danger text-white px-3 py-1">Administrator Portal</span>
              <span className="badge bg-light text-secondary border small">Website Management Only</span>
            </div>
            <h2 className="fw-bold text-navy mb-0" style={{ color: 'var(--primary-navy)' }}>
              Platform Administration
            </h2>
          </div>

          <div className="d-flex flex-wrap gap-2">
            <button
              type="button"
              className="btn btn-navy d-flex align-items-center gap-2 shadow-sm"
              onClick={openCreateModal}
            >
              <i className="bi bi-plus-circle"></i> Add Scheme
            </button>
            <button
              type="button"
              className="btn btn-outline-primary d-flex align-items-center gap-2 shadow-sm"
              onClick={openCreateAnnouncement}
            >
              <i className="bi bi-megaphone"></i> New Announcement
            </button>
          </div>
        </div>

        {/* Global Action Message */}
        {actionMsg.text && (
          <div className={`alert alert-${actionMsg.type} alert-dismissible fade show mb-4`} role="alert">
            <i className="bi bi-check-circle-fill me-2"></i>
            {actionMsg.text}
            <button type="button" className="btn-close" onClick={() => setActionMsg({ type: '', text: '' })}></button>
          </div>
        )}

        {error && (
          <div className="alert alert-danger d-flex align-items-center gap-2 mb-4">
            <i className="bi bi-exclamation-triangle-fill"></i>
            <div>{error}</div>
          </div>
        )}

        {loading ? (
          <LoadingSpinner message="Retrieving administration modules and live data..." />
        ) : (
          <>
            {/* Top Stat Cards (All Real MongoDB Counts) */}
            <div className="row g-3 mb-4">
              <div className="col-xl-2 col-md-4 col-sm-6">
                <div className="stat-card p-3 h-100" style={{ borderLeft: '4px solid #2563eb' }}>
                  <div className="stat-label small">Registered Students</div>
                  <div className="stat-number fs-4 text-navy fw-bold">{metrics?.totalStudents || 0}</div>
                  <div className="small text-muted mt-1">
                    <i className="bi bi-people text-primary me-1"></i> Student Accounts
                  </div>
                </div>
              </div>

              <div className="col-xl-2 col-md-4 col-sm-6">
                <div className="stat-card p-3 h-100" style={{ borderLeft: '4px solid #10b981' }}>
                  <div className="stat-label small">Total Schemes</div>
                  <div className="stat-number fs-4 text-success fw-bold">{metrics?.totalSchemes || 0}</div>
                  <div className="small text-muted mt-1">
                    <i className="bi bi-award text-success me-1"></i> Live Schemes
                  </div>
                </div>
              </div>

              <div className="col-xl-2 col-md-4 col-sm-6">
                <div className="stat-card p-3 h-100" style={{ borderLeft: '4px solid #0284c7' }}>
                  <div className="stat-label small">Active Schemes</div>
                  <div className="stat-number fs-4 text-primary fw-bold">{metrics?.activeSchemes || 0}</div>
                  <div className="small text-muted mt-1">
                    <i className="bi bi-unlock text-primary me-1"></i> Status: Open
                  </div>
                </div>
              </div>

              <div className="col-xl-3 col-md-6 col-sm-6">
                <div className="stat-card p-3 h-100" style={{ borderLeft: '4px solid #f59e0b' }}>
                  <div className="stat-label small">Needs Verification</div>
                  <div className="stat-number fs-4 text-warning fw-bold">
                    {metrics?.schemesNeedingVerification || 0}
                  </div>
                  <div className="small text-muted mt-1">
                    <i className="bi bi-shield-exclamation text-warning me-1"></i> Verification Queue
                  </div>
                </div>
              </div>

              <div className="col-xl-3 col-md-6 col-sm-12">
                <div className="stat-card p-3 h-100" style={{ borderLeft: '4px solid #8b5cf6' }}>
                  <div className="stat-label small">Published Announcements</div>
                  <div className="stat-number fs-4 text-purple fw-bold" style={{ color: '#8b5cf6' }}>
                    {metrics?.publishedAnnouncements || announcements.length || 0}
                  </div>
                  <div className="small text-muted mt-1">
                    <i className="bi bi-megaphone text-purple me-1"></i> Portal Broadcasts
                  </div>
                </div>
              </div>
            </div>

            {/* Admin Management Navigation Bar */}
            <div className="card custom-card shadow-sm border-0 mb-4">
              <div className="card-header bg-white border-bottom p-0">
                <ul className="nav nav-tabs border-0 px-3 pt-2">
                  <li className="nav-item">
                    <button
                      className={`nav-link fw-semibold border-0 py-3 ${
                        activeTab === 'DASHBOARD'
                          ? 'active text-primary border-bottom border-primary border-3'
                          : 'text-muted'
                      }`}
                      onClick={() => setTab('DASHBOARD')}
                    >
                      <i className="bi bi-speedometer2 me-2"></i> Overview
                    </button>
                  </li>
                  <li className="nav-item">
                    <button
                      className={`nav-link fw-semibold border-0 py-3 ${
                        activeTab === 'SCHEMES'
                          ? 'active text-primary border-bottom border-primary border-3'
                          : 'text-muted'
                      }`}
                      onClick={() => setTab('SCHEMES')}
                    >
                      <i className="bi bi-award me-2"></i> Scheme Management ({schemes.length})
                    </button>
                  </li>
                  <li className="nav-item">
                    <button
                      className={`nav-link fw-semibold border-0 py-3 ${
                        activeTab === 'RULES'
                          ? 'active text-primary border-bottom border-primary border-3'
                          : 'text-muted'
                      }`}
                      onClick={() => setTab('RULES')}
                    >
                      <i className="bi bi-sliders me-2"></i> Eligibility Rules
                    </button>
                  </li>
                  <li className="nav-item">
                    <button
                      className={`nav-link fw-semibold border-0 py-3 ${
                        activeTab === 'STUDENTS'
                          ? 'active text-primary border-bottom border-primary border-3'
                          : 'text-muted'
                      }`}
                      onClick={() => setTab('STUDENTS')}
                    >
                      <i className="bi bi-people me-2"></i> Student Management ({students.length})
                    </button>
                  </li>
                  <li className="nav-item">
                    <button
                      className={`nav-link fw-semibold border-0 py-3 ${
                        activeTab === 'VERIFICATION'
                          ? 'active text-primary border-bottom border-primary border-3'
                          : 'text-muted'
                      }`}
                      onClick={() => setTab('VERIFICATION')}
                    >
                      <i className="bi bi-shield-check me-2"></i> Scheme Verification
                    </button>
                  </li>
                  <li className="nav-item">
                    <button
                      className={`nav-link fw-semibold border-0 py-3 ${
                        activeTab === 'ANNOUNCEMENTS'
                          ? 'active text-primary border-bottom border-primary border-3'
                          : 'text-muted'
                      }`}
                      onClick={() => setTab('ANNOUNCEMENTS')}
                    >
                      <i className="bi bi-megaphone me-2"></i> Announcements ({announcements.length})
                    </button>
                  </li>
                  <li className="nav-item">
                    <button
                      className={`nav-link fw-semibold border-0 py-3 ${
                        activeTab === 'PROFILE'
                          ? 'active text-primary border-bottom border-primary border-3'
                          : 'text-muted'
                      }`}
                      onClick={() => setTab('PROFILE')}
                    >
                      <i className="bi bi-shield-person me-2"></i> Admin Profile
                    </button>
                  </li>
                </ul>
              </div>

              <div className="card-body p-4">
                {/* ============================================================== */}
                {/* TAB 1: OVERVIEW & DASHBOARD METRICS */}
                {/* ============================================================== */}
                {activeTab === 'DASHBOARD' && (
                  <div>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h5 className="fw-bold text-navy mb-0" style={{ color: 'var(--primary-navy)' }}>
                        Recently Added Scholarship Schemes
                      </h5>
                      <button className="btn btn-sm btn-outline-primary" onClick={() => setTab('SCHEMES')}>
                        View All Schemes &rarr;
                      </button>
                    </div>

                    <div className="table-responsive mb-4">
                      <table className="table table-hover align-middle mb-0">
                        <thead className="table-light">
                          <tr>
                            <th>Scheme Name</th>
                            <th>Category</th>
                            <th>Status</th>
                            <th>Verification</th>
                            <th>Deadline</th>
                            <th className="text-end">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(metrics?.recentSchemes || schemes.slice(0, 5)).map((s) => (
                            <tr key={s._id}>
                              <td className="fw-semibold text-navy">
                                <Link to={`/schemes/${s._id}`} className="text-decoration-none text-dark">
                                  {s.name}
                                </Link>
                              </td>
                              <td>
                                <span className="badge bg-light text-dark border small">{s.category}</span>
                              </td>
                              <td>
                                <span
                                  className={`badge ${s.applicationStatus === 'Open' ? 'bg-success' : 'bg-secondary'}`}
                                >
                                  {s.applicationStatus}
                                </span>
                              </td>
                              <td>
                                <span className="badge bg-light text-secondary border small">
                                  <i className="bi bi-shield-check text-success me-1"></i>
                                  {s.verificationStatus}
                                </span>
                              </td>
                              <td className="small text-muted">{s.applicationDeadline || 'Always Open'}</td>
                              <td className="text-end">
                                <div className="btn-group btn-group-sm">
                                  <Link to={`/schemes/${s._id}`} className="btn btn-outline-secondary" title="View Scheme">
                                    <i className="bi bi-eye"></i>
                                  </Link>
                                  <button
                                    className="btn btn-outline-primary"
                                    onClick={() => openEditModal(s)}
                                    title="Edit Scheme"
                                  >
                                    <i className="bi bi-pencil"></i>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Published Announcements Preview */}
                    <div className="d-flex justify-content-between align-items-center mb-3 pt-3 border-top">
                      <h5 className="fw-bold text-navy mb-0" style={{ color: 'var(--primary-navy)' }}>
                        Active Platform Announcements
                      </h5>
                      <button className="btn btn-sm btn-outline-primary" onClick={() => setTab('ANNOUNCEMENTS')}>
                        Manage Announcements &rarr;
                      </button>
                    </div>

                    <div className="row g-3">
                      {announcements.length === 0 ? (
                        <div className="col-12 text-muted small p-3">No announcements published yet.</div>
                      ) : (
                        announcements.slice(0, 3).map((ann) => (
                          <div key={ann._id} className="col-md-4">
                            <div className="card h-100 shadow-sm border p-3">
                              <div className="d-flex justify-content-between align-items-center mb-2">
                                <span className="badge bg-primary bg-opacity-10 text-primary small">
                                  {ann.category}
                                </span>
                                <span className="badge bg-success bg-opacity-10 text-success small">Published</span>
                              </div>
                              <h6 className="fw-bold text-navy mb-1">{ann.title}</h6>
                              <p className="text-secondary small mb-0" style={{ lineHeight: '1.5' }}>
                                {ann.content}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* ============================================================== */}
                {/* TAB 2: SCHEME MANAGEMENT */}
                {/* ============================================================== */}
                {activeTab === 'SCHEMES' && (
                  <div>
                    {/* Filters & Search */}
                    <div className="row g-3 mb-4">
                      <div className="col-md-6">
                        <div className="input-group">
                          <span className="input-group-text bg-white">
                            <i className="bi bi-search text-muted"></i>
                          </span>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Search schemes by title or government ministry..."
                            value={schemeSearch}
                            onChange={(e) => setSchemeSearch(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="col-md-4">
                        <select
                          className="form-select"
                          value={schemeCategoryFilter}
                          onChange={(e) => setSchemeCategoryFilter(e.target.value)}
                        >
                          <option value="All">All Scheme Categories</option>
                          {categories.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-2 text-end">
                        <button className="btn btn-navy w-100" onClick={openCreateModal}>
                          <i className="bi bi-plus-circle me-1"></i> Add Scheme
                        </button>
                      </div>
                    </div>

                    <div className="table-responsive">
                      <table className="table table-hover align-middle mb-0">
                        <thead className="table-light">
                          <tr>
                            <th style={{ width: '30%' }}>Scholarship Scheme</th>
                            <th>Category</th>
                            <th>Applicable States</th>
                            <th>Deadline</th>
                            <th>Status</th>
                            <th>Verification</th>
                            <th className="text-end">Admin Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredSchemes.length === 0 ? (
                            <tr>
                              <td colSpan="7" className="text-center py-4 text-muted">
                                No scholarship schemes found matching filters.
                              </td>
                            </tr>
                          ) : (
                            filteredSchemes.map((scheme) => (
                              <tr key={scheme._id}>
                                <td>
                                  <div className="fw-semibold text-navy">{scheme.name}</div>
                                  <div className="text-muted small text-truncate" style={{ maxWidth: '320px' }}>
                                    {scheme.ministry || 'Government of India'}
                                  </div>
                                </td>
                                <td>
                                  <span className="scheme-category-tag">{scheme.category}</span>
                                </td>
                                <td className="small">{scheme.applicableStates?.join(', ') || 'All India'}</td>
                                <td className="small text-muted">{scheme.applicationDeadline || 'Open'}</td>
                                <td>
                                  <span
                                    className={`badge ${scheme.applicationStatus === 'Open' ? 'bg-success' : 'bg-secondary'}`}
                                  >
                                    {scheme.applicationStatus}
                                  </span>
                                </td>
                                <td>
                                  <SchemeVerificationBadge status={scheme.verificationStatus} />
                                </td>
                                <td className="text-end">
                                  <div className="btn-group btn-group-sm">
                                    <Link
                                      to={`/schemes/${scheme._id}`}
                                      className="btn btn-outline-secondary"
                                      title="View Scheme Details"
                                    >
                                      <i className="bi bi-eye"></i>
                                    </Link>
                                    <button
                                      className="btn btn-outline-primary"
                                      onClick={() => openEditModal(scheme)}
                                      title="Edit Scheme Details"
                                    >
                                      <i className="bi bi-pencil"></i>
                                    </button>
                                    <button
                                      className="btn btn-outline-info text-dark"
                                      onClick={() => {
                                        setSelectedRuleSchemeId(scheme._id);
                                        setTab('RULES');
                                      }}
                                      title="Configure Eligibility Rules"
                                    >
                                      <i className="bi bi-sliders"></i>
                                    </button>
                                    <button
                                      className="btn btn-outline-warning text-dark"
                                      onClick={() => openVerifyModal(scheme)}
                                      title="Update Verification Status"
                                    >
                                      <i className="bi bi-shield-check"></i>
                                    </button>
                                    <button
                                      className="btn btn-outline-danger"
                                      onClick={() => handleDeleteScheme(scheme._id, scheme.name)}
                                      title="Delete Scheme"
                                    >
                                      <i className="bi bi-trash"></i>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* ============================================================== */}
                {/* TAB 3: ELIGIBILITY RULE MANAGEMENT */}
                {/* ============================================================== */}
                {activeTab === 'RULES' && (
                  <div>
                    <div className="row g-3 mb-4 align-items-center">
                      <div className="col-md-7">
                        <label className="form-label fw-bold small text-navy">
                          Select Scholarship Scheme to Configure Conditions:
                        </label>
                        <select
                          className="form-select"
                          value={selectedRuleSchemeId}
                          onChange={(e) => setSelectedRuleSchemeId(e.target.value)}
                        >
                          {schemes.map((s) => (
                            <option key={s._id} value={s._id}>
                              {s.name} ({s.category})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-md-5 text-md-end mt-4">
                        <button className="btn btn-navy" onClick={openAddRuleModal}>
                          <i className="bi bi-plus-circle me-1"></i> Add Condition Rule
                        </button>
                      </div>
                    </div>

                    {currentRuleScheme ? (
                      <div className="card border p-3">
                        <div className="d-flex justify-content-between align-items-start mb-3">
                          <div>
                            <h5 className="fw-bold text-navy mb-1">{currentRuleScheme.name}</h5>
                            <span className="badge bg-light text-secondary border me-2">
                              {currentRuleScheme.category}
                            </span>
                            <span className="small text-muted">
                              Active Rules: {currentRuleScheme.eligibilityRules?.length || 0}
                            </span>
                          </div>
                          <Link to={`/schemes/${currentRuleScheme._id}`} className="btn btn-sm btn-outline-secondary">
                            View Live Details
                          </Link>
                        </div>

                        <div className="table-responsive">
                          <table className="table table-bordered align-middle small mb-0">
                            <thead className="table-light">
                              <tr>
                                <th>#</th>
                                <th>Condition Label</th>
                                <th>Tested Profile Field</th>
                                <th>Operator</th>
                                <th>Threshold / Value</th>
                                <th>Mandatory</th>
                                <th>Failure Advice</th>
                                <th className="text-end">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {!currentRuleScheme.eligibilityRules ||
                              currentRuleScheme.eligibilityRules.length === 0 ? (
                                <tr>
                                  <td colSpan="8" className="text-center py-4 text-muted">
                                    No condition rules configured yet. Click "Add Condition Rule" to define criteria.
                                  </td>
                                </tr>
                              ) : (
                                currentRuleScheme.eligibilityRules.map((rule, idx) => (
                                  <tr key={idx}>
                                    <td className="fw-bold">{idx + 1}</td>
                                    <td className="fw-semibold text-navy">{rule.label}</td>
                                    <td>
                                      <code>{rule.field}</code>
                                    </td>
                                    <td>
                                      <span className="badge bg-light text-dark border">{rule.operator}</span>
                                    </td>
                                    <td className="fw-medium">
                                      {Array.isArray(rule.value)
                                        ? rule.value.join(', ')
                                        : typeof rule.value === 'boolean'
                                        ? rule.value
                                          ? 'Yes'
                                          : 'No'
                                        : String(rule.value)}
                                    </td>
                                    <td>
                                      <span
                                        className={`badge ${
                                          rule.mandatory ? 'bg-danger bg-opacity-10 text-danger' : 'bg-secondary'
                                        }`}
                                      >
                                        {rule.mandatory ? 'Mandatory' : 'Optional'}
                                      </span>
                                    </td>
                                    <td className="text-muted small">{rule.explanationOnFail || '—'}</td>
                                    <td className="text-end">
                                      <div className="btn-group btn-group-sm">
                                        <button
                                          className="btn btn-outline-primary"
                                          onClick={() => openEditRuleModal(rule, idx)}
                                          title="Edit Rule"
                                        >
                                          <i className="bi bi-pencil"></i>
                                        </button>
                                        <button
                                          className="btn btn-outline-danger"
                                          onClick={() => handleDeleteRule(idx)}
                                          title="Remove Rule"
                                        >
                                          <i className="bi bi-trash"></i>
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      <div className="alert alert-info">Please select a scheme above to view and configure rules.</div>
                    )}
                  </div>
                )}

                {/* ============================================================== */}
                {/* TAB 4: STUDENT MANAGEMENT */}
                {/* ============================================================== */}
                {activeTab === 'STUDENTS' && (
                  <div>
                    <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
                      <div className="flex-grow-1" style={{ maxWidth: '480px' }}>
                        <div className="input-group">
                          <span className="input-group-text bg-white">
                            <i className="bi bi-search text-muted"></i>
                          </span>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Search students by name, email, college or degree..."
                            value={studentSearch}
                            onChange={(e) => setStudentSearch(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="small text-muted">
                        Total Registered: <strong>{students.length}</strong>
                      </div>
                    </div>

                    <div className="alert alert-info border-0 d-flex align-items-center gap-2 mb-3 py-2 small">
                      <i className="bi bi-shield-lock-fill text-primary fs-6"></i>
                      <span>
                        <strong>Privacy-First Architecture:</strong> In accordance with zero-PII storage policy,
                        student personal certificates and documents are strictly student-private and cannot be accessed
                        or managed by administrators.
                      </span>
                    </div>

                    <div className="table-responsive">
                      <table className="table table-hover align-middle mb-0">
                        <thead className="table-light">
                          <tr>
                            <th>Student Name</th>
                            <th>Email Address</th>
                            <th>College &amp; Degree</th>
                            <th>Year &amp; State</th>
                            <th>Registered On</th>
                            <th>Account Status</th>
                            <th className="text-end">Account Control</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredStudents.length === 0 ? (
                            <tr>
                              <td colSpan="7" className="text-center py-4 text-muted">
                                No registered college students found matching search.
                              </td>
                            </tr>
                          ) : (
                            filteredStudents.map((stu) => (
                              <tr key={stu._id}>
                                <td className="fw-bold text-navy">{stu.name}</td>
                                <td>
                                  <a href={`mailto:${stu.email}`} className="text-decoration-none">
                                    {stu.email}
                                  </a>
                                </td>
                                <td>
                                  <div className="small text-dark fw-medium">{stu.collegeName || 'College Student'}</div>
                                  <div className="small text-muted">{stu.course || 'Undergraduate'}</div>
                                </td>
                                <td className="small">
                                  <span>Year {stu.studyYear || 1}</span> &bull;{' '}
                                  <span className="text-muted">{stu.state || 'All India'}</span>
                                </td>
                                <td className="small text-muted">
                                  {stu.createdAt
                                    ? new Date(stu.createdAt).toLocaleDateString('en-IN', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric'
                                      })
                                    : 'Recent'}
                                </td>
                                <td>
                                  <span
                                    className={`badge ${
                                      stu.isActive !== false ? 'bg-success bg-opacity-10 text-success' : 'bg-danger text-white'
                                    }`}
                                  >
                                    {stu.isActive !== false ? 'Active' : 'Deactivated'}
                                  </span>
                                </td>
                                <td className="text-end">
                                  <button
                                    type="button"
                                    className={`btn btn-sm ${
                                      stu.isActive !== false ? 'btn-outline-danger' : 'btn-outline-success'
                                    }`}
                                    onClick={() => handleToggleStudentStatus(stu)}
                                  >
                                    <i
                                      className={`bi ${stu.isActive !== false ? 'bi-person-dash' : 'bi-person-check'} me-1`}
                                    ></i>
                                    {stu.isActive !== false ? 'Deactivate' : 'Activate'}
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* ============================================================== */}
                {/* TAB 5: SCHEME VERIFICATION */}
                {/* ============================================================== */}
                {activeTab === 'VERIFICATION' && (
                  <div>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <div>
                        <h5 className="fw-bold text-navy mb-1" style={{ color: 'var(--primary-navy)' }}>
                          Government Scheme Verification &amp; Official URL Tracker
                        </h5>
                        <p className="text-muted small mb-0">
                          Verify scholarship guidelines against official gazettes and portals to protect students from
                          outdated deadlines.
                        </p>
                      </div>
                    </div>

                    <div className="table-responsive">
                      <table className="table table-hover align-middle mb-0">
                        <thead className="table-light">
                          <tr>
                            <th>Scholarship Scheme</th>
                            <th>Verification Status</th>
                            <th>Official Portal URL</th>
                            <th>Last Verified</th>
                            <th className="text-end">Update Verification</th>
                          </tr>
                        </thead>
                        <tbody>
                          {schemes.map((scheme) => (
                            <tr key={scheme._id}>
                              <td className="fw-semibold text-navy">
                                <div>{scheme.name}</div>
                                <div className="text-muted small">{scheme.ministry}</div>
                              </td>
                              <td>
                                <SchemeVerificationBadge status={scheme.verificationStatus} />
                              </td>
                              <td>
                                <a
                                  href={scheme.officialUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="small text-truncate d-inline-block text-primary"
                                  style={{ maxWidth: '280px' }}
                                >
                                  <i className="bi bi-box-arrow-up-right me-1"></i>
                                  {scheme.officialUrl}
                                </a>
                              </td>
                              <td className="small text-muted">{scheme.lastVerified || 'Recent'}</td>
                              <td className="text-end">
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-primary"
                                  onClick={() => openVerifyModal(scheme)}
                                >
                                  <i className="bi bi-shield-check me-1"></i> Update Status
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* ============================================================== */}
                {/* TAB 6: ANNOUNCEMENT MANAGEMENT */}
                {/* ============================================================== */}
                {activeTab === 'ANNOUNCEMENTS' && (
                  <div>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <div>
                        <h5 className="fw-bold text-navy mb-1" style={{ color: 'var(--primary-navy)' }}>
                          Portal Announcements &amp; Advisories
                        </h5>
                        <p className="text-muted small mb-0">
                          Broadcast deadline extensions, portal maintenance, and scholarship updates to registered students.
                        </p>
                      </div>
                      <button className="btn btn-navy btn-sm" onClick={openCreateAnnouncement}>
                        <i className="bi bi-plus-circle me-1"></i> Create Announcement
                      </button>
                    </div>

                    <div className="table-responsive">
                      <table className="table table-hover align-middle mb-0">
                        <thead className="table-light">
                          <tr>
                            <th>Title &amp; Category</th>
                            <th>Content Message</th>
                            <th>Publish Status</th>
                            <th>Created Date</th>
                            <th className="text-end">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {announcements.length === 0 ? (
                            <tr>
                              <td colSpan="5" className="text-center py-4 text-muted">
                                No announcements created yet. Click "Create Announcement" to publish updates.
                              </td>
                            </tr>
                          ) : (
                            announcements.map((ann) => (
                              <tr key={ann._id}>
                                <td style={{ width: '25%' }}>
                                  <div className="fw-semibold text-navy">{ann.title}</div>
                                  <span className="badge bg-light text-secondary border small mt-1">
                                    {ann.category}
                                  </span>
                                </td>
                                <td>
                                  <div className="small text-secondary" style={{ lineHeight: '1.5' }}>
                                    {ann.content}
                                  </div>
                                </td>
                                <td>
                                  {ann.publicationStatus === 'Published' || (ann.isPublished && ann.publicationStatus !== 'Unpublished' && ann.publicationStatus !== 'Draft') ? (
                                    <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2 py-1">
                                      <i className="bi bi-broadcast me-1"></i> Published
                                    </span>
                                  ) : ann.publicationStatus === 'Unpublished' ? (
                                    <span className="badge bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25 px-2 py-1">
                                      <i className="bi bi-eye-slash me-1"></i> Unpublished
                                    </span>
                                  ) : (
                                    <span className="badge bg-warning bg-opacity-10 text-warning-emphasis border border-warning border-opacity-25 px-2 py-1">
                                      <i className="bi bi-file-earmark me-1"></i> Draft
                                    </span>
                                  )}
                                </td>
                                <td className="small text-muted">
                                  {ann.publishedAt
                                    ? new Date(ann.publishedAt).toLocaleDateString('en-IN', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric'
                                      })
                                    : ann.createdAt
                                    ? new Date(ann.createdAt).toLocaleDateString('en-IN', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric'
                                      })
                                    : 'Recent'}
                                </td>
                                <td className="text-end">
                                  <div className="btn-group btn-group-sm">
                                    <button
                                      className={`btn ${
                                        (ann.publicationStatus === 'Published' || (ann.isPublished && ann.publicationStatus !== 'Unpublished' && ann.publicationStatus !== 'Draft'))
                                          ? 'btn-outline-warning'
                                          : 'btn-outline-success'
                                      }`}
                                      onClick={() => handleTogglePublishAnnouncement(ann)}
                                      title={
                                        (ann.publicationStatus === 'Published' || (ann.isPublished && ann.publicationStatus !== 'Unpublished' && ann.publicationStatus !== 'Draft'))
                                          ? 'Unpublish Announcement'
                                          : 'Publish Announcement'
                                      }
                                    >
                                      <i
                                        className={`bi ${
                                          (ann.publicationStatus === 'Published' || (ann.isPublished && ann.publicationStatus !== 'Unpublished' && ann.publicationStatus !== 'Draft'))
                                            ? 'bi-eye-slash'
                                            : 'bi-broadcast'
                                        }`}
                                      ></i>
                                    </button>
                                    <button
                                      className="btn btn-outline-primary"
                                      onClick={() => openEditAnnouncement(ann)}
                                      title="Edit Announcement"
                                    >
                                      <i className="bi bi-pencil"></i>
                                    </button>
                                    <button
                                      className="btn btn-outline-danger"
                                      onClick={() => handleDeleteAnnouncement(ann._id, ann.title)}
                                      title="Delete Announcement"
                                    >
                                      <i className="bi bi-trash"></i>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* ============================================================== */}
                {/* TAB 7: ADMIN PROFILE */}
                {/* ============================================================== */}
                {activeTab === 'PROFILE' && (
                  <div className="row justify-content-center">
                    <div className="col-md-7">
                      <div className="card border p-4 shadow-sm">
                        <div className="d-flex align-items-center gap-3 mb-4 border-bottom pb-3">
                          <div
                            className="rounded-circle bg-danger text-white d-flex align-items-center justify-content-center fs-3"
                            style={{ width: '64px', height: '64px' }}
                          >
                            <i className="bi bi-shield-shaded"></i>
                          </div>
                          <div>
                            <h4 className="fw-bold text-navy mb-0">{user?.name || 'Portal Administrator'}</h4>
                            <span className="badge bg-danger text-white mt-1">Platform Administrator</span>
                          </div>
                        </div>

                        <div className="row g-3">
                          <div className="col-sm-6">
                            <label className="text-muted small">Admin Email</label>
                            <div className="fw-semibold text-dark">{user?.email || 'admin@schemesathi.gov.in'}</div>
                          </div>
                          <div className="col-sm-6">
                            <label className="text-muted small">Assigned Department</label>
                            <div className="fw-semibold text-dark">
                              {user?.collegeName || 'State Higher Education Council'}
                            </div>
                          </div>
                          <div className="col-sm-6">
                            <label className="text-muted small">Role Responsibility</label>
                            <div className="fw-semibold text-dark">Website &amp; Scheme Catalogue Maintenance</div>
                          </div>
                          <div className="col-sm-6">
                            <label className="text-muted small">Jurisdiction</label>
                            <div className="fw-semibold text-dark">{user?.state || 'All India'}</div>
                          </div>
                        </div>

                        <div className="alert alert-light border mt-4 mb-0 small text-muted">
                          <i className="bi bi-info-circle me-1 text-primary"></i>
                          Administrators only manage platform content, eligibility rules, and student account statuses.
                          Personal scholarship applications and document management remain student-exclusive.
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* ============================================================== */}
      {/* MODAL 1: SCHEME ADD / EDIT MODAL */}
      {/* ============================================================== */}
      {showSchemeModal && (
        <div
          className="modal show d-block scholarship-modal-backdrop"
          tabIndex="-1"
          role="dialog"
          aria-modal="true"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowSchemeModal(false);
          }}
        >
          <div className="modal-dialog modal-lg modal-dialog-centered scholarship-modal-dialog">
            <form onSubmit={handleSchemeSubmit} className="modal-content border-0 shadow-lg scholarship-modal">
              <div
                className="modal-header bg-navy text-white scholarship-modal-header"
                style={{ backgroundColor: 'var(--primary-navy)' }}
              >
                <h5 className="modal-title fw-bold">
                  {modalMode === 'CREATE' ? 'Add New Scholarship Scheme' : 'Edit Scholarship Scheme'}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowSchemeModal(false)}
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body p-4 scholarship-modal-body">
                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label small fw-bold">Scheme Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      value={schemeForm.name}
                      onChange={(e) => setSchemeForm({ ...schemeForm, name: e.target.value })}
                      placeholder="e.g. AICTE Pragati Scholarship for Girls"
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label small fw-bold">Category *</label>
                    <select
                      className="form-select"
                      value={schemeForm.category}
                      onChange={(e) => setSchemeForm({ ...schemeForm, category: e.target.value })}
                    >
                      {categories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label small fw-bold">Government Ministry / Department</label>
                    <input
                      type="text"
                      className="form-control"
                      value={schemeForm.ministry}
                      onChange={(e) => setSchemeForm({ ...schemeForm, ministry: e.target.value })}
                      placeholder="e.g. Ministry of Education"
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label small fw-bold">Short Description *</label>
                    <textarea
                      className="form-control"
                      rows="2"
                      required
                      value={schemeForm.description}
                      onChange={(e) => setSchemeForm({ ...schemeForm, description: e.target.value })}
                      placeholder="Concise scheme summary..."
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label small fw-bold">Detailed Overview</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={schemeForm.detailedDescription}
                      onChange={(e) => setSchemeForm({ ...schemeForm, detailedDescription: e.target.value })}
                      placeholder="Comprehensive details and guidelines..."
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label small fw-bold">Applicable States (comma-separated)</label>
                    <input
                      type="text"
                      className="form-control"
                      value={schemeForm.applicableStates}
                      onChange={(e) => setSchemeForm({ ...schemeForm, applicableStates: e.target.value })}
                      placeholder="All India, Tamil Nadu"
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label small fw-bold">Education Level</label>
                    <select
                      className="form-select"
                      value={schemeForm.educationLevels}
                      onChange={(e) => setSchemeForm({ ...schemeForm, educationLevels: e.target.value })}
                    >
                      <option value="Undergraduate">Undergraduate</option>
                      <option value="Postgraduate">Postgraduate</option>
                      <option value="Diploma">Diploma</option>
                      <option value="All Higher Education">All Higher Education</option>
                    </select>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label small fw-bold">Financial Benefits (one per line)</label>
                    <textarea
                      className="form-control"
                      rows="2"
                      value={schemeForm.benefits}
                      onChange={(e) => setSchemeForm({ ...schemeForm, benefits: e.target.value })}
                      placeholder="₹50,000 per annum for tuition fees"
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label small fw-bold">Required Documents (one per line)</label>
                    <textarea
                      className="form-control"
                      rows="2"
                      value={schemeForm.requiredDocuments}
                      onChange={(e) => setSchemeForm({ ...schemeForm, requiredDocuments: e.target.value })}
                      placeholder="Income Certificate&#10;Bonafide Certificate"
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label small fw-bold">Application Deadline</label>
                    <input
                      type="text"
                      className="form-control"
                      value={schemeForm.applicationDeadline}
                      onChange={(e) => setSchemeForm({ ...schemeForm, applicationDeadline: e.target.value })}
                      placeholder="e.g. 31 Dec 2026 or Always Open"
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label small fw-bold">Application Status</label>
                    <select
                      className="form-select"
                      value={schemeForm.applicationStatus}
                      onChange={(e) => setSchemeForm({ ...schemeForm, applicationStatus: e.target.value })}
                    >
                      <option value="Open">Open</option>
                      <option value="Upcoming">Upcoming</option>
                      <option value="Closed">Closed</option>
                      <option value="Always Open">Always Open</option>
                    </select>
                  </div>

                  <div className="col-12">
                    <label className="form-label small fw-bold">Official Application Portal URL *</label>
                    <input
                      type="url"
                      className="form-control"
                      required
                      value={schemeForm.officialUrl}
                      onChange={(e) => setSchemeForm({ ...schemeForm, officialUrl: e.target.value })}
                      placeholder="https://scholarships.gov.in"
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer bg-light scholarship-modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowSchemeModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-navy">
                  {modalMode === 'CREATE' ? 'Add Scheme' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: ELIGIBILITY RULE CONFIGURATION MODAL */}
      {/* ============================================================== */}
      {showRuleModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-navy text-white" style={{ backgroundColor: 'var(--primary-navy)' }}>
                <h5 className="modal-title fw-bold">
                  {ruleEditIndex !== null ? 'Edit Eligibility Condition' : 'Add Eligibility Condition'}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowRuleModal(false)}
                ></button>
              </div>
              <form onSubmit={handleSaveRule}>
                <div className="modal-body p-4">
                  {/* Preset Selector */}
                  <div className="mb-3">
                    <label className="form-label small fw-bold text-muted">Use Common Condition Preset:</label>
                    <select
                      className="form-select form-select-sm"
                      onChange={(e) => handleRulePresetSelect(e.target.value)}
                      defaultValue=""
                    >
                      <option value="" disabled>
                        -- Select Preset to Auto-Fill --
                      </option>
                      {ruleFieldPresets.map((p) => (
                        <option key={p.field} value={p.field}>
                          {p.label} ({p.operator} {p.defaultValue})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold">Condition Label *</label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      value={ruleForm.label}
                      onChange={(e) => setRuleForm({ ...ruleForm, label: e.target.value })}
                      placeholder="e.g. Annual Family Income Below ₹2,50,000"
                    />
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-sm-6">
                      <label className="form-label small fw-bold">Profile Field Identifier *</label>
                      <input
                        type="text"
                        className="form-control"
                        required
                        value={ruleForm.field}
                        onChange={(e) => setRuleForm({ ...ruleForm, field: e.target.value })}
                        placeholder="annualFamilyIncome"
                      />
                    </div>
                    <div className="col-sm-6">
                      <label className="form-label small fw-bold">Comparison Operator *</label>
                      <select
                        className="form-select"
                        value={ruleForm.operator}
                        onChange={(e) => setRuleForm({ ...ruleForm, operator: e.target.value })}
                      >
                        <option value="lte">&le; Less than or equal to (Limit)</option>
                        <option value="gte">&ge; Greater than or equal to (Min %)</option>
                        <option value="eq">= Equal to</option>
                        <option value="in">IN (Comma-separated list)</option>
                        <option value="boolean_eq">Boolean (Yes / No)</option>
                      </select>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold">Threshold / Accepted Values *</label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      value={ruleForm.value}
                      onChange={(e) => setRuleForm({ ...ruleForm, value: e.target.value })}
                      placeholder="250000 or SC, ST or true"
                    />
                    <div className="form-text small">
                      For numbers, enter digits (e.g. 250000 or 60). For lists, use comma separation. For yes/no, enter
                      true or false.
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold">Failure Explanation</label>
                    <input
                      type="text"
                      className="form-control"
                      value={ruleForm.explanationOnFail}
                      onChange={(e) => setRuleForm({ ...ruleForm, explanationOnFail: e.target.value })}
                      placeholder="Guidance shown when student criteria fails..."
                    />
                  </div>

                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="ruleMandatoryCheck"
                      checked={ruleForm.mandatory}
                      onChange={(e) => setRuleForm({ ...ruleForm, mandatory: e.target.checked })}
                    />
                    <label className="form-check-label small fw-semibold" htmlFor="ruleMandatoryCheck">
                      Mandatory Condition (Disqualifies student if unmet)
                    </label>
                  </div>
                </div>
                <div className="modal-footer bg-light">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowRuleModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-navy">
                    Save Condition
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 3: SCHEME VERIFICATION MODAL */}
      {/* ============================================================== */}
      {showVerifyModal && verifyScheme && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-navy text-white" style={{ backgroundColor: 'var(--primary-navy)' }}>
                <h5 className="modal-title fw-bold">Update Scheme Verification</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowVerifyModal(false)}
                ></button>
              </div>
              <form onSubmit={handleVerifySubmit}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="text-muted small">Scheme</label>
                    <div className="fw-bold text-navy">{verifyScheme.name}</div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold">Verification Status *</label>
                    <select
                      className="form-select"
                      value={verifyForm.verificationStatus}
                      onChange={(e) => setVerifyForm({ ...verifyForm, verificationStatus: e.target.value })}
                    >
                      <option value="Verified">Verified</option>
                      <option value="Needs Verification">Needs Verification</option>
                      <option value="Outdated">Outdated</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold">Official Application Portal URL *</label>
                    <input
                      type="url"
                      className="form-control"
                      required
                      value={verifyForm.officialUrl}
                      onChange={(e) => setVerifyForm({ ...verifyForm, officialUrl: e.target.value })}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold">Last Verified Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={verifyForm.lastVerified}
                      onChange={(e) => setVerifyForm({ ...verifyForm, lastVerified: e.target.value })}
                    />
                  </div>
                </div>
                <div className="modal-footer bg-light">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowVerifyModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-navy">
                    Confirm Verification
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 4: ANNOUNCEMENT MODAL */}
      {/* ============================================================== */}
      {showAnnouncementModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-navy text-white" style={{ backgroundColor: 'var(--primary-navy)' }}>
                <h5 className="modal-title fw-bold">
                  {announcementMode === 'CREATE' ? 'Publish Announcement' : 'Edit Announcement'}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowAnnouncementModal(false)}
                ></button>
              </div>
              <form onSubmit={handleAnnouncementSubmit}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label small fw-bold">Announcement Title *</label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      value={announcementForm.title}
                      onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                      placeholder="e.g. National Scholarship Portal Deadline Extended"
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold">Category</label>
                    <select
                      className="form-select"
                      value={announcementForm.category}
                      onChange={(e) => setAnnouncementForm({ ...announcementForm, category: e.target.value })}
                    >
                      <option value="General">General Notice</option>
                      <option value="Deadline Extension">Deadline Extension</option>
                      <option value="New Scheme">New Scheme Launch</option>
                      <option value="Urgent Notice">Urgent Notice</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold">Announcement Content *</label>
                    <textarea
                      className="form-control"
                      rows="4"
                      required
                      value={announcementForm.content}
                      onChange={(e) => setAnnouncementForm({ ...announcementForm, content: e.target.value })}
                      placeholder="Detailed announcement text for college students..."
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold">Publication Status *</label>
                    <select
                      className="form-select"
                      value={announcementForm.publicationStatus || (announcementForm.isPublished ? 'Published' : 'Draft')}
                      onChange={(e) => {
                        const val = e.target.value;
                        setAnnouncementForm({
                          ...announcementForm,
                          publicationStatus: val,
                          isPublished: val === 'Published'
                        });
                      }}
                    >
                      <option value="Published">Published (Visible to all students)</option>
                      <option value="Draft">Draft (Hidden from students)</option>
                      <option value="Unpublished">Unpublished (Archived)</option>
                    </select>
                    <div className="form-text small">
                      Only announcements with "Published" status are visible to students.
                    </div>
                  </div>
                </div>
                <div className="modal-footer bg-light">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowAnnouncementModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-navy">
                    {announcementMode === 'CREATE' ? 'Publish Now' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
