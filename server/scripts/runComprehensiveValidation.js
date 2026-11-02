// Automated verification script using native fetch for all 6 tests in the user specification
const BASE_URL = 'http://localhost:5000/api';

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  let data;
  try {
    data = await res.json();
  } catch (err) {
    data = null;
  }
  return { status: res.status, ok: res.ok, data };
}

async function run() {
  console.log('====================================================');
  console.log('STARTING AUTOMATED VALIDATION SUITE (TESTS 1 to 6)');
  console.log('====================================================\n');

  // Step 0: Authentication
  console.log('Authenticating Admin and Student users...');
  const adminLogin = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: 'admin@schemesathi.gov.in',
      password: 'adminpassword123'
    })
  });
  if (!adminLogin.ok) throw new Error('Admin login failed');
  const adminToken = adminLogin.data.token;
  console.log('✓ Admin authenticated:', adminLogin.data.user.email);

  const studentLogin = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: 'ananya.ramesh@college.edu',
      password: 'password123'
    })
  });
  if (!studentLogin.ok) throw new Error('Student login failed');
  const studentToken = studentLogin.data.token;
  console.log('✓ Student authenticated:', studentLogin.data.user.email);

  const adminHeaders = { Authorization: `Bearer ${adminToken}` };
  const studentHeaders = { Authorization: `Bearer ${studentToken}` };

  // ----------------------------------------------------
  // TEST 1: Scheme verification synchronization
  // ----------------------------------------------------
  console.log('\n--- TEST 1: Scheme Verification (to Verified) ---');
  // Find "National Scholarship For Post Graduate Studies"
  const schemesRes = await request('/schemes', { headers: studentHeaders });
  const targetScheme = schemesRes.data.schemes.find(s =>
    s.name.includes('National Scholarship For Post Graduate Studies') ||
    s.name.includes('Post Graduate')
  ) || schemesRes.data.schemes[0];

  console.log(`Target Scheme: "${targetScheme.name}" (ID: ${targetScheme._id})`);
  console.log(`Initial student-observed verificationStatus: "${targetScheme.verificationStatus}"`);

  // Admin updates verification to 'Verified'
  const updateToVerified = await request(`/admin/schemes/${targetScheme._id}/verification`, {
    method: 'PUT',
    headers: adminHeaders,
    body: JSON.stringify({
      verificationStatus: 'Verified',
      officialUrl: 'https://scholarships.gov.in/pg-merit-verified',
      lastVerified: new Date().toISOString().split('T')[0]
    })
  });
  if (!updateToVerified.ok) throw new Error('Admin update to Verified failed: ' + JSON.stringify(updateToVerified.data));
  console.log('✓ Admin update response verificationStatus:', updateToVerified.data.scheme.verificationStatus);

  // Student fetches scheme discovery
  const studentDiscoveryRes1 = await request('/schemes', { headers: studentHeaders });
  const verifiedSchemeStudent = studentDiscoveryRes1.data.schemes.find(s => s._id === targetScheme._id);
  console.log('✓ Student-observed verificationStatus after Admin verification:', verifiedSchemeStudent.verificationStatus);

  if (verifiedSchemeStudent.verificationStatus !== 'Verified') {
    throw new Error(`TEST 1 FAILED: Expected 'Verified', got '${verifiedSchemeStudent.verificationStatus}'`);
  }
  // Check Scheme details by ID as student
  const studentDetailsRes1 = await request(`/schemes/${targetScheme._id}`, { headers: studentHeaders });
  if (studentDetailsRes1.data.scheme.verificationStatus !== 'Verified') {
    throw new Error(`TEST 1 FAILED on details: Expected 'Verified', got '${studentDetailsRes1.data.scheme.verificationStatus}'`);
  }
  console.log('✓ Scheme Details endpoint also returns: Verified');
  console.log('>>> TEST 1 PASSED: Admin Verified status successfully synchronized to Student portal.');

  // ----------------------------------------------------
  // TEST 2: Verification status changes (to Outdated & Needs Verification)
  // ----------------------------------------------------
  console.log('\n--- TEST 2: Verification status changes (to Outdated) ---');
  // Admin changes status to Outdated
  const updateToOutdated = await request(`/admin/schemes/${targetScheme._id}/verification`, {
    method: 'PUT',
    headers: adminHeaders,
    body: JSON.stringify({
      verificationStatus: 'Outdated',
      officialUrl: targetScheme.officialUrl || 'https://scholarships.gov.in',
      lastVerified: new Date().toISOString().split('T')[0]
    })
  });
  if (!updateToOutdated.ok) throw new Error('Admin update to Outdated failed');
  console.log('✓ Admin update response verificationStatus:', updateToOutdated.data.scheme.verificationStatus);

  // Student fetches schemes
  const studentDiscoveryRes2 = await request('/schemes', { headers: studentHeaders });
  const outdatedSchemeStudent = studentDiscoveryRes2.data.schemes.find(s => s._id === targetScheme._id);
  console.log('✓ Student-observed verificationStatus after Admin changed to Outdated:', outdatedSchemeStudent.verificationStatus);

  if (outdatedSchemeStudent.verificationStatus !== 'Outdated') {
    throw new Error(`TEST 2 FAILED: Expected 'Outdated', got '${outdatedSchemeStudent.verificationStatus}'`);
  }
  console.log('>>> TEST 2 PASSED: Admin Outdated status successfully synchronized to Student portal.');

  // ----------------------------------------------------
  // TEST 3: Announcement publishing (Draft vs Published)
  // ----------------------------------------------------
  console.log('\n--- TEST 3: Announcement publishing ---');
  const draftTitle = `Urgent Notice: Verification Test ${Date.now()}`;
  const createDraftRes = await request('/admin/announcements', {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      title: draftTitle,
      content: 'This announcement is currently in draft mode and should NOT be visible to students.',
      category: 'General',
      publicationStatus: 'Draft'
    })
  });
  if (!createDraftRes.ok) throw new Error('Create draft announcement failed');
  const createdAnnId = createDraftRes.data.announcement._id;
  console.log(`✓ Admin created announcement in Draft mode (ID: ${createdAnnId})`);

  // Student checks published announcements
  const studentAnnRes1 = await request('/announcements/published', { headers: studentHeaders });
  const foundInPublished1 = (studentAnnRes1.data.announcements || []).some(a => a._id === createdAnnId || a.title === draftTitle);
  console.log(`✓ Student /api/announcements/published contains Draft announcement? ${foundInPublished1}`);
  if (foundInPublished1) {
    throw new Error('TEST 3 FAILED: Draft announcement was visible to student!');
  }

  // Student checks dashboard
  const studentDashboardRes1 = await request('/dashboard', { headers: studentHeaders });
  const foundInDash1 = (studentDashboardRes1.data.announcements || []).some(a => a._id === createdAnnId || a.title === draftTitle);
  console.log(`✓ Student dashboard contains Draft announcement? ${foundInDash1}`);
  if (foundInDash1) {
    throw new Error('TEST 3 FAILED: Draft announcement was visible on student dashboard!');
  }

  // Admin publishes the announcement
  console.log('Admin publishing the announcement...');
  const publishRes = await request(`/admin/announcements/${createdAnnId}`, {
    method: 'PUT',
    headers: adminHeaders,
    body: JSON.stringify({
      publicationStatus: 'Published'
    })
  });
  if (!publishRes.ok) throw new Error('Publish announcement failed');
  console.log('✓ Admin publish response status:', publishRes.data.announcement.publicationStatus);

  // Student checks published announcements again
  const studentAnnRes2 = await request('/announcements/published', { headers: studentHeaders });
  const publishedAnn = (studentAnnRes2.data.announcements || []).find(a => a._id === createdAnnId);
  console.log('✓ Student /api/announcements/published found published announcement?', !!publishedAnn);
  if (!publishedAnn) {
    throw new Error('TEST 3 FAILED: Published announcement is not visible in /api/announcements/published!');
  }

  // Student checks dashboard again
  const studentDashboardRes2 = await request('/dashboard', { headers: studentHeaders });
  const dashAnn = (studentDashboardRes2.data.announcements || []).find(a => a._id === createdAnnId);
  console.log('✓ Student dashboard found published announcement?', !!dashAnn);
  if (!dashAnn) {
    throw new Error('TEST 3 FAILED: Published announcement is not visible on student dashboard!');
  }
  console.log('>>> TEST 3 PASSED: Draft announcement is hidden; Published announcement is immediately visible to students.');

  // ----------------------------------------------------
  // TEST 4: Announcement updates
  // ----------------------------------------------------
  console.log('\n--- TEST 4: Announcement updates ---');
  const updatedMessage = `UPDATED: Scholarship deadline extended to November 30! [Timestamp: ${Date.now()}]`;
  const updateAnnRes = await request(`/admin/announcements/${createdAnnId}`, {
    method: 'PUT',
    headers: adminHeaders,
    body: JSON.stringify({
      message: updatedMessage,
      content: updatedMessage,
      category: 'Deadline Extension'
    })
  });
  if (!updateAnnRes.ok) throw new Error('Update announcement failed');
  console.log('✓ Admin updated announcement content.');

  // Student retrieves announcements
  const studentAnnRes3 = await request('/announcements/published', { headers: studentHeaders });
  const updatedStudentAnn = (studentAnnRes3.data.announcements || []).find(a => a._id === createdAnnId);
  console.log('✓ Student observes updated message:', updatedStudentAnn?.message || updatedStudentAnn?.content);

  if (!updatedStudentAnn || (updatedStudentAnn.message !== updatedMessage && updatedStudentAnn.content !== updatedMessage)) {
    throw new Error('TEST 4 FAILED: Updated announcement message was not reflected for student!');
  }
  console.log('>>> TEST 4 PASSED: Admin edits immediately reflect in student portal.');

  // ----------------------------------------------------
  // TEST 5: Announcement deletion
  // ----------------------------------------------------
  console.log('\n--- TEST 5: Announcement deletion ---');
  const deleteRes = await request(`/admin/announcements/${createdAnnId}`, {
    method: 'DELETE',
    headers: adminHeaders
  });
  if (!deleteRes.ok) throw new Error('Delete announcement failed');
  console.log('✓ Admin deleted announcement.');

  // Student checks published announcements
  const studentAnnRes4 = await request('/announcements/published', { headers: studentHeaders });
  const stillExistsAnn = (studentAnnRes4.data.announcements || []).some(a => a._id === createdAnnId);
  console.log('✓ Student can still see deleted announcement?', stillExistsAnn);
  if (stillExistsAnn) {
    throw new Error('TEST 5 FAILED: Deleted announcement still returned to student!');
  }

  // Student checks dashboard
  const studentDashboardRes4 = await request('/dashboard', { headers: studentHeaders });
  const stillInDash = (studentDashboardRes4.data.announcements || []).some(a => a._id === createdAnnId);
  console.log('✓ Deleted announcement still in student dashboard?', stillInDash);
  if (stillInDash) {
    throw new Error('TEST 5 FAILED: Deleted announcement still present on student dashboard!');
  }
  console.log('>>> TEST 5 PASSED: Deleted announcement is immediately removed from student portal.');

  // ----------------------------------------------------
  // TEST 6: Security and Role Separation
  // ----------------------------------------------------
  console.log('\n--- TEST 6: Security and Role Separation ---');
  const studentAttemptVerification = await request(`/admin/schemes/${targetScheme._id}/verification`, {
    method: 'PUT',
    headers: studentHeaders,
    body: JSON.stringify({ verificationStatus: 'Verified' })
  });
  console.log(`✓ Student modifying scheme verification received HTTP ${studentAttemptVerification.status}`);
  if (studentAttemptVerification.status !== 403 && studentAttemptVerification.status !== 401) {
    throw new Error('TEST 6 FAILED: Student was not blocked from modifying verification!');
  }

  const studentAttemptAnnouncement = await request('/admin/announcements', {
    method: 'POST',
    headers: studentHeaders,
    body: JSON.stringify({
      title: 'Hacked announcement',
      content: 'Unauthorized',
      publicationStatus: 'Published'
    })
  });
  console.log(`✓ Student creating announcement received HTTP ${studentAttemptAnnouncement.status}`);
  if (studentAttemptAnnouncement.status !== 403 && studentAttemptAnnouncement.status !== 401) {
    throw new Error('TEST 6 FAILED: Student was not blocked from creating announcement!');
  }

  console.log('>>> TEST 6 PASSED: Backend strictly enforces admin role separation.');

  console.log('\n====================================================');
  console.log('ALL 6 TESTS PASSED SUCCESSFULLY! 100% COMPLIANT.');
  console.log('====================================================\n');
}

run().catch((err) => {
  console.error('\n❌ VALIDATION ERROR:', err.message);
  process.exit(1);
});
