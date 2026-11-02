const BASE_URL = 'http://localhost:5000/api';

async function api(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

async function runRoleSeparationTests() {
  console.log('====================================================');
  console.log('   STARTING ROLE SEPARATION & SECURITY TEST SUITE   ');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message, details = '') {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message} ${details ? '- ' + JSON.stringify(details) : ''}`);
      failed++;
    }
  }

  // --- STEP 1: AUTHENTICATION ---
  console.log('\n--- 1. AUTHENTICATION & TOKEN ACQUISITION ---');
  
  const adminLogin = await api('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: 'admin@schemesathi.gov.in',
      password: 'adminpassword123'
    })
  });
  assert(adminLogin.status === 200 && adminLogin.data.token && adminLogin.data.user.role === 'admin',
    'Admin login successful with role: admin', adminLogin.data);
  const adminToken = adminLogin.data.token;
  const adminHeaders = { Authorization: `Bearer ${adminToken}` };

  const studentLogin = await api('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: 'ananya.ramesh@college.edu',
      password: 'password123'
    })
  });
  assert(studentLogin.status === 200 && studentLogin.data.token && studentLogin.data.user.role === 'student',
    'Student login successful with role: student', studentLogin.data);
  const studentToken = studentLogin.data.token;
  const studentHeaders = { Authorization: `Bearer ${studentToken}` };
  const studentId = studentLogin.data.user._id;

  // --- STEP 2: ADMIN CAPABILITIES ---
  console.log('\n--- 2. ADMIN CAPABILITIES & METRICS ---');

  // Metrics
  const metricsRes = await api('/admin/metrics', { headers: adminHeaders });
  assert(metricsRes.status === 200 &&
    typeof metricsRes.data.metrics?.totalStudents === 'number' &&
    typeof metricsRes.data.metrics?.totalSchemes === 'number' &&
    typeof metricsRes.data.metrics?.activeSchemes === 'number' &&
    typeof metricsRes.data.metrics?.schemesNeedingVerification === 'number' &&
    typeof metricsRes.data.metrics?.publishedAnnouncements === 'number',
    'Admin dashboard returns live MongoDB metrics', metricsRes.data);

  // Student list
  const studentsRes = await api('/admin/students', { headers: adminHeaders });
  assert(studentsRes.status === 200 && Array.isArray(studentsRes.data.students) && studentsRes.data.students.length > 0,
    `Admin can list registered students (found: ${studentsRes.data.students?.length})`);
  
  // Verify student personal documents are not leaked in admin student view
  const sampleStudent = studentsRes.data.students[0];
  assert(sampleStudent && !sampleStudent.password && sampleStudent.documents === undefined,
    'Student list preserves privacy (no passwords or personal document CRUD exposed)');

  // Fetch schemes to get a sample scheme ID
  const allSchemesRes = await api('/schemes');
  const sampleScheme = allSchemesRes.data.schemes[0];
  assert(sampleScheme?._id, `Retrieved sample scheme: ${sampleScheme?.name} (${sampleScheme?._id})`);

  // Scheme verification update
  const verifyRes = await api(`/admin/schemes/${sampleScheme._id}/verification`, {
    method: 'PUT',
    headers: adminHeaders,
    body: JSON.stringify({
      verificationStatus: 'Verified',
      officialApplicationUrl: sampleScheme.officialApplicationUrl || 'https://scholarships.gov.in',
      verificationNotes: 'Verified by Admin automated security check'
    })
  });
  assert(verifyRes.status === 200 && verifyRes.data.scheme?.verificationStatus === 'Verified',
    'Admin can update scheme verification status & official URL');

  // Scheme rules update
  const rulesRes = await api(`/admin/schemes/${sampleScheme._id}/rules`, {
    method: 'PUT',
    headers: adminHeaders,
    body: JSON.stringify({
      maxIncomeLimit: 500000,
      minAcademicPercentage: 70,
      allowedEducationLevels: ['undergraduate', 'postgraduate'],
      allowedCategories: ['General', 'OBC', 'SC', 'ST'],
      allowedStates: ['All India']
    })
  });
  assert(rulesRes.status === 200 && Array.isArray(rulesRes.data.scheme?.eligibilityRules),
    'Admin can configure scheme eligibility conditions/rules');

  // Announcements CRUD
  const createAnnounce = await api('/admin/announcements', {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      title: 'Portal System Maintenance Notice',
      content: 'Scheduled maintenance for platform optimization on Sunday midnight.',
      category: 'System',
      isPublished: true,
      priority: 'high'
    })
  });
  assert(createAnnounce.status === 201 && createAnnounce.data.announcement?._id,
    'Admin can publish announcements', createAnnounce.data);
  const announcementId = createAnnounce.data.announcement?._id;

  const getAnnounceAdmin = await api('/admin/announcements', { headers: adminHeaders });
  assert(getAnnounceAdmin.status === 200 && Array.isArray(getAnnounceAdmin.data.announcements),
    'Admin can retrieve all announcements list');

  const updateAnnounce = await api(`/admin/announcements/${announcementId}`, {
    method: 'PUT',
    headers: adminHeaders,
    body: JSON.stringify({
      title: 'Portal System Maintenance Notice (Updated)',
      isPublished: true
    })
  });
  assert(updateAnnounce.status === 200 && updateAnnounce.data.announcement?.title.includes('Updated'),
    'Admin can update announcements');

  // Scheme CRUD
  const createSchemeRes = await api('/schemes', {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      name: 'Test Temporary Admin Scholarship',
      slug: 'test-temp-admin-scholarship',
      category: 'Merit-based',
      description: 'Annual scholarship assistance for undergraduate meritorious students.',
      educationLevels: ['Undergraduate'],
      applicableStates: ['All India'],
      benefits: ['Annual ₹25,000 allowance'],
      officialApplicationUrl: 'https://scholarships.gov.in',
      applicationDeadline: '2026-12-31'
    })
  });
  assert(createSchemeRes.status === 201 && createSchemeRes.data.scheme?._id,
    'Admin can create new scholarship schemes');
  const tempSchemeId = createSchemeRes.data.scheme?._id;

  if (tempSchemeId) {
    const editSchemeRes = await api(`/schemes/${tempSchemeId}`, {
      method: 'PUT',
      headers: adminHeaders,
      body: JSON.stringify({
        name: 'Test Temporary Admin Scholarship (Edited)'
      })
    });
    assert(editSchemeRes.status === 200 && editSchemeRes.data.scheme?.name.includes('Edited'),
      'Admin can edit scholarship schemes');

    const deleteSchemeRes = await api(`/schemes/${tempSchemeId}`, {
      method: 'DELETE',
      headers: adminHeaders
    });
    assert(deleteSchemeRes.status === 200,
      'Admin can delete scholarship schemes');
  }

  // --- STEP 3: BACKEND STUDENT PROTECTION (ADMIN BLOCKED) ---
  console.log('\n--- 3. BACKEND STUDENT PROTECTION (ADMIN BLOCKED FROM STUDENT APIS) ---');

  const adminDocGet = await api('/documents', { headers: adminHeaders });
  assert(adminDocGet.status === 403,
    'Admin cannot access student documents (GET /api/documents returns 403 Forbidden)');

  const adminDocPost = await api('/documents', {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      documentType: 'Aadhaar Card',
      documentNumber: '1234-5678-9012',
      expiryDate: '2026-12-31'
    })
  });
  assert(adminDocPost.status === 403,
    'Admin cannot create student documents (POST /api/documents returns 403 Forbidden)');

  const adminProfileGet = await api('/profile', { headers: adminHeaders });
  assert(adminProfileGet.status === 403,
    'Admin cannot access student profile endpoints (GET /api/profile returns 403 Forbidden)');

  const adminNotifGet = await api('/notifications', { headers: adminHeaders });
  assert(adminNotifGet.status === 403,
    'Admin cannot access student notifications (GET /api/notifications returns 403 Forbidden)');

  const adminGapAnalysis = await api('/schemes/eligibility', {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({ schemeId: sampleScheme._id })
  });
  assert(adminGapAnalysis.status === 403,
    'Admin cannot run student eligibility gap analysis (POST /api/schemes/eligibility returns 403 Forbidden)');

  const adminRecommended = await api('/schemes/recommended', { headers: adminHeaders });
  assert(adminRecommended.status === 403,
    'Admin cannot access student recommended schemes (GET /api/schemes/recommended returns 403 Forbidden)');

  // Scheme Details Role Check: Admin requesting scheme details does NOT receive student-specific calculation
  const adminSchemeDetail = await api(`/schemes/${sampleScheme._id}`, { headers: adminHeaders });
  assert(adminSchemeDetail.status === 200 && (adminSchemeDetail.data.scheme?.eligibilityResult === null || adminSchemeDetail.data.scheme?.eligibilityResult === undefined),
    'Admin viewing scheme details does NOT receive student-specific eligibility results');

  // --- STEP 4: STUDENT CAPABILITIES ---
  console.log('\n--- 4. STUDENT CAPABILITIES ---');

  const studentDocs = await api('/documents', { headers: studentHeaders });
  assert(studentDocs.status === 200 && Array.isArray(studentDocs.data.documents),
    'Student can access personal document tracker');

  const studentProfile = await api('/profile', { headers: studentHeaders });
  assert(studentProfile.status === 200 && (studentProfile.data.profile?.fullName || studentProfile.data.profile?.userId),
    'Student can access personal student profile');

  const studentNotifs = await api('/notifications', { headers: studentHeaders });
  assert(studentNotifs.status === 200 && Array.isArray(studentNotifs.data.notifications),
    'Student can access personal notifications');

  const studentPublicAnnounce = await api('/announcements');
  assert(studentPublicAnnounce.status === 200 && Array.isArray(studentPublicAnnounce.data.announcements),
    'Student/Public can view published announcements');

  const studentSchemeDetail = await api(`/schemes/${sampleScheme._id}`, { headers: studentHeaders });
  assert(studentSchemeDetail.status === 200 && studentSchemeDetail.data.scheme?.eligibilityResult !== undefined,
    'Student viewing scheme details receives personalized eligibility engine calculation');

  // --- STEP 5: BACKEND ADMIN PROTECTION (STUDENT BLOCKED) ---
  console.log('\n--- 5. BACKEND ADMIN PROTECTION (STUDENT BLOCKED FROM ADMIN APIS) ---');

  const studentMetrics = await api('/admin/metrics', { headers: studentHeaders });
  assert(studentMetrics.status === 403,
    'Student cannot access admin metrics (GET /api/admin/metrics returns 403 Forbidden)');

  const studentStudents = await api('/admin/students', { headers: studentHeaders });
  assert(studentStudents.status === 403,
    'Student cannot access student management list (GET /api/admin/students returns 403 Forbidden)');

  const studentToggleStatus = await api(`/admin/students/${studentId}/status`, {
    method: 'PUT',
    headers: studentHeaders,
    body: JSON.stringify({ isActive: false })
  });
  assert(studentToggleStatus.status === 403,
    'Student cannot deactivate student accounts (PUT /api/admin/students/:id/status returns 403 Forbidden)');

  const studentVerifyScheme = await api(`/admin/schemes/${sampleScheme._id}/verification`, {
    method: 'PUT',
    headers: studentHeaders,
    body: JSON.stringify({ verificationStatus: 'Needs Verification' })
  });
  assert(studentVerifyScheme.status === 403,
    'Student cannot modify scheme verification (PUT /api/admin/schemes/:id/verification returns 403 Forbidden)');

  const studentUpdateRules = await api(`/admin/schemes/${sampleScheme._id}/rules`, {
    method: 'PUT',
    headers: studentHeaders,
    body: JSON.stringify({ maxIncomeLimit: 100000 })
  });
  assert(studentUpdateRules.status === 403,
    'Student cannot modify scheme rules (PUT /api/admin/schemes/:id/rules returns 403 Forbidden)');

  const studentPostScheme = await api('/schemes', {
    method: 'POST',
    headers: studentHeaders,
    body: JSON.stringify({ name: 'Malicious Scheme' })
  });
  assert(studentPostScheme.status === 403,
    'Student cannot create scholarship schemes (POST /api/schemes returns 403 Forbidden)');

  const studentPutScheme = await api(`/schemes/${sampleScheme._id}`, {
    method: 'PUT',
    headers: studentHeaders,
    body: JSON.stringify({ name: 'Hacked Name' })
  });
  assert(studentPutScheme.status === 403,
    'Student cannot edit scholarship schemes (PUT /api/schemes/:id returns 403 Forbidden)');

  const studentDeleteScheme = await api(`/schemes/${sampleScheme._id}`, {
    method: 'DELETE',
    headers: studentHeaders
  });
  assert(studentDeleteScheme.status === 403,
    'Student cannot delete scholarship schemes (DELETE /api/schemes/:id returns 403 Forbidden)');

  const studentPostAnnounce = await api('/admin/announcements', {
    method: 'POST',
    headers: studentHeaders,
    body: JSON.stringify({ title: 'Student Fake Announcement', content: 'fake' })
  });
  assert(studentPostAnnounce.status === 403,
    'Student cannot publish announcements (POST /api/admin/announcements returns 403 Forbidden)');

  // --- STEP 6: ACCOUNT ACTIVATION / DEACTIVATION ENFORCEMENT ---
  console.log('\n--- 6. ACCOUNT ACTIVATION / DEACTIVATION SECURITY ---');

  // Admin deactivates student
  const deactRes = await api(`/admin/students/${studentId}/status`, {
    method: 'PUT',
    headers: adminHeaders,
    body: JSON.stringify({ isActive: false })
  });
  assert(deactRes.status === 200 && deactRes.data.student?.isActive === false,
    'Admin successfully deactivated student account');

  // Deactivated student tries to access protected endpoint
  const deactAccess = await api('/documents', { headers: studentHeaders });
  assert(deactAccess.status === 403,
    'Deactivated student token is immediately rejected on protected routes (returns 403 Forbidden)');

  // Deactivated student tries to log in
  const deactLogin = await api('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: 'ananya.ramesh@college.edu',
      password: 'password123'
    })
  });
  assert(deactLogin.status === 403,
    'Deactivated student login attempt is blocked with 403 Forbidden');

  // Admin reactivates student
  const reactRes = await api(`/admin/students/${studentId}/status`, {
    method: 'PUT',
    headers: adminHeaders,
    body: JSON.stringify({ isActive: true })
  });
  assert(reactRes.status === 200 && reactRes.data.student?.isActive === true,
    'Admin successfully reactivated student account');

  // Reactivated student can login again
  const reactLogin = await api('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: 'ananya.ramesh@college.edu',
      password: 'password123'
    })
  });
  assert(reactLogin.status === 200 && reactLogin.data.token,
    'Reactivated student can successfully log in and resume accessing platform');

  // Clean up created test announcement
  if (announcementId) {
    await api(`/admin/announcements/${announcementId}`, {
      method: 'DELETE',
      headers: adminHeaders
    });
  }

  // --- FINAL SUMMARY ---
  console.log('\n====================================================');
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runRoleSeparationTests().catch(err => {
  console.error('Test run failed with error:', err);
  process.exit(1);
});
