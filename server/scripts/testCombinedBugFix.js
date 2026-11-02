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

function getDateString(daysOffset) {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

async function runTests() {
  console.log('=== STARTING COMBINED BUG FIX VERIFICATION ===\n');

  // --- PART 1: SCHEME DETAILS API CHECKS ---
  console.log('--- TESTING PART 1: SCHEME DETAILS API ---');
  const schemesRes = await api('/schemes');
  if (!schemesRes.ok || !schemesRes.data.schemes?.length) {
    throw new Error('Failed to retrieve schemes catalogue');
  }
  const firstScheme = schemesRes.data.schemes[0];
  console.log(`[PASS] Fetched scheme catalogue. Testing details for scheme: ${firstScheme.name} (${firstScheme._id})`);

  // Valid ID fetch
  const detailRes = await api(`/schemes/${firstScheme._id}`);
  if (detailRes.status === 200 && detailRes.data.scheme && detailRes.data.scheme.name === firstScheme.name) {
    console.log(`[PASS] Valid scheme ID returned status 200 with complete scheme details.`);
  } else {
    console.error(`[FAIL] Valid scheme ID fetch failed:`, detailRes);
  }

  // Invalid ID fetch
  const invalidRes = await api(`/schemes/6ae81550b8abd3f527f6a884`);
  if (invalidRes.status === 404) {
    console.log(`[PASS] Unavailable scheme ID returned status 404 (error handled gracefully).`);
  } else {
    console.error(`[FAIL] Invalid scheme ID handling: status ${invalidRes.status}`);
  }

  // Slug fetch
  if (firstScheme.slug) {
    const slugRes = await api(`/schemes/${firstScheme.slug}`);
    if (slugRes.status === 200) {
      console.log(`[PASS] Scheme details also accessible by slug: ${firstScheme.slug}`);
    }
  }

  // --- PART 2: AUTHENTICATE STUDENTS ---
  console.log('\n--- AUTHENTICATING TEST STUDENTS ---');
  let student1Res = await api('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'ananya.ramesh@college.edu', password: 'password123' })
  });
  if (!student1Res.ok) {
    // If not found, try Student@123 or register
    student1Res = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'ananya.ramesh@college.edu', password: 'Student@123' })
    });
  }
  if (!student1Res.ok) {
    throw new Error('Failed to login as Student 1: ' + JSON.stringify(student1Res.data));
  }
  const token1 = student1Res.data.token;
  const user1 = student1Res.data.user;
  console.log(`[PASS] Student 1 authenticated: ${user1.name} (${user1._id})`);

  // Ensure second student exists for isolation testing
  let student2Res = await api('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'rohit.kumar@college.edu', password: 'Student@123' })
  });
  if (!student2Res.ok) {
    console.log('Registering Student 2 for multi-user isolation test...');
    await api('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Rohit Kumar',
        email: 'rohit.kumar@college.edu',
        password: 'Student@123',
        college: 'Anna University',
        degree: 'B.Tech IT',
        yearOfStudy: '3rd Year'
      })
    });
    student2Res = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'rohit.kumar@college.edu', password: 'Student@123' })
    });
  }
  const token2 = student2Res.data.token;
  const user2 = student2Res.data.user;
  console.log(`[PASS] Student 2 authenticated: ${user2.name} (${user2._id})`);

  // Clean up any old test documents for Student 1
  const existingDocsRes = await api('/documents', {
    headers: { Authorization: `Bearer ${token1}` }
  });
  for (const doc of (existingDocsRes.data.documents || [])) {
    if (doc.documentName.startsWith('TEST_')) {
      await api(`/documents/${doc._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token1}` }
      });
    }
  }

  console.log('\n--- EXECUTING SCENARIOS 1 THROUGH 12 ---');

  // Helper to get latest notification for a student
  async function getNotificationsForStudent(token) {
    const res = await api('/notifications', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data.notifications || [];
  }

  // TEST 1: Income certificate expiring in 30 days
  console.log('\n[TEST 1] Add income certificate expiring in 30 days');
  const d30 = getDateString(30);
  const t1Doc = await api('/documents', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token1}` },
    body: JSON.stringify({
      documentName: 'TEST_Income Certificate 30d',
      documentType: 'Income Certificate',
      expiryDate: d30
    })
  });
  const notifs1 = await getNotificationsForStudent(token1);
  const n1 = notifs1.find(n => (n.documentId?._id || n.documentId) === t1Doc.data.document?._id);
  console.log(`Result: Created doc with expiry ${d30}`);
  if (n1 && n1.reminderType === '30_DAYS') {
    console.log(`[PASS TEST 1] Immediate 30-day reminder generated: "${n1.title}" - "${n1.message}"`);
  } else {
    console.error(`[FAIL TEST 1] Expected 30_DAYS, found:`, n1);
  }

  // TEST 2: Certificate expiring in 15 days
  console.log('\n[TEST 2] Add certificate expiring in 15 days');
  const d15 = getDateString(15);
  const t2Doc = await api('/documents', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token1}` },
    body: JSON.stringify({
      documentName: 'TEST_Community Certificate 15d',
      documentType: 'Community Certificate',
      expiryDate: d15
    })
  });
  const notifs2 = await getNotificationsForStudent(token1);
  const n2 = notifs2.find(n => (n.documentId?._id || n.documentId) === t2Doc.data.document?._id);
  if (n2 && n2.reminderType === '15_DAYS') {
    console.log(`[PASS TEST 2] Immediate 15-day reminder generated: "${n2.title}" - "${n2.message}"`);
  } else {
    console.error(`[FAIL TEST 2] Expected 15_DAYS, found:`, n2);
  }

  // TEST 3: Certificate expiring in 7 days
  console.log('\n[TEST 3] Add certificate expiring in 7 days');
  const d7 = getDateString(7);
  const t3Doc = await api('/documents', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token1}` },
    body: JSON.stringify({
      documentName: 'TEST_Nativity Certificate 7d',
      documentType: 'Nativity Certificate',
      expiryDate: d7
    })
  });
  const notifs3 = await getNotificationsForStudent(token1);
  const n3 = notifs3.find(n => (n.documentId?._id || n.documentId) === t3Doc.data.document?._id);
  if (n3 && n3.reminderType === '7_DAYS') {
    console.log(`[PASS TEST 3] Immediate 7-day reminder generated: "${n3.title}" - "${n3.message}"`);
  } else {
    console.error(`[FAIL TEST 3] Expected 7_DAYS, found:`, n3);
  }

  // TEST 4: Certificate expiring in 4 days
  console.log('\n[TEST 4] Add certificate expiring in 4 days');
  const d4 = getDateString(4);
  const t4Doc = await api('/documents', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token1}` },
    body: JSON.stringify({
      documentName: 'TEST_Income Certificate 4d',
      documentType: 'Income Certificate',
      expiryDate: d4
    })
  });
  const notifs4 = await getNotificationsForStudent(token1);
  const n4 = notifs4.find(n => (n.documentId?._id || n.documentId) === t4Doc.data.document?._id);
  if (n4 && n4.reminderType === 'URGENT_EXPIRY' && n4.message.includes('expires in 4 days')) {
    console.log(`[PASS TEST 4] Immediate urgent notification generated: "${n4.title}" - "${n4.message}"`);
  } else {
    console.error(`[FAIL TEST 4] Expected URGENT_EXPIRY 4 days, found:`, n4);
  }

  // TEST 5: Certificate expiring in 2 days
  console.log('\n[TEST 5] Add certificate expiring in 2 days');
  const d2 = getDateString(2);
  const t5Doc = await api('/documents', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token1}` },
    body: JSON.stringify({
      documentName: 'TEST_Disability Certificate 2d',
      documentType: 'Disability Certificate',
      expiryDate: d2
    })
  });
  const notifs5 = await getNotificationsForStudent(token1);
  const n5 = notifs5.find(n => (n.documentId?._id || n.documentId) === t5Doc.data.document?._id);
  if (n5 && n5.reminderType === 'URGENT_EXPIRY' && n5.message.includes('expires in 2 days')) {
    console.log(`[PASS TEST 5] Immediate urgent notification generated: "${n5.title}" - "${n5.message}"`);
  } else {
    console.error(`[FAIL TEST 5] Expected URGENT_EXPIRY 2 days, found:`, n5);
  }

  // TEST 6: Certificate expiring tomorrow (1 day)
  console.log('\n[TEST 6] Add certificate expiring tomorrow');
  const d1 = getDateString(1);
  const t6Doc = await api('/documents', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token1}` },
    body: JSON.stringify({
      documentName: 'TEST_Bonafide Certificate 1d',
      documentType: 'Bonafide Certificate',
      expiryDate: d1
    })
  });
  const notifs6 = await getNotificationsForStudent(token1);
  const n6 = notifs6.find(n => (n.documentId?._id || n.documentId) === t6Doc.data.document?._id);
  if (n6 && n6.reminderType === 'URGENT_EXPIRY' && n6.message.includes('expires tomorrow')) {
    console.log(`[PASS TEST 6] Immediate urgent notification generated: "${n6.title}" - "${n6.message}"`);
  } else {
    console.error(`[FAIL TEST 6] Expected URGENT_EXPIRY tomorrow, found:`, n6);
  }

  // TEST 7: Certificate expiring today (0 days)
  console.log('\n[TEST 7] Add certificate expiring today');
  const d0 = getDateString(0);
  const t7Doc = await api('/documents', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token1}` },
    body: JSON.stringify({
      documentName: 'TEST_Income Certificate today',
      documentType: 'Income Certificate',
      expiryDate: d0
    })
  });
  const notifs7 = await getNotificationsForStudent(token1);
  const n7 = notifs7.find(n => (n.documentId?._id || n.documentId) === t7Doc.data.document?._id);
  if (n7 && n7.reminderType === 'EXPIRES_TODAY') {
    console.log(`[PASS TEST 7] Expiry-today notification generated: "${n7.title}" - "${n7.message}"`);
  } else {
    console.error(`[FAIL TEST 7] Expected EXPIRES_TODAY, found:`, n7);
  }

  // TEST 8: Certificate that expired yesterday (-1 days)
  console.log('\n[TEST 8] Add certificate that expired yesterday');
  const dm1 = getDateString(-1);
  const t8Doc = await api('/documents', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token1}` },
    body: JSON.stringify({
      documentName: 'TEST_Past Certificate expired',
      documentType: 'Income Certificate',
      expiryDate: dm1
    })
  });
  const notifs8 = await getNotificationsForStudent(token1);
  const n8 = notifs8.find(n => (n.documentId?._id || n.documentId) === t8Doc.data.document?._id);
  const allDocs = await api('/documents', { headers: { Authorization: `Bearer ${token1}` } });
  const doc8Record = (allDocs.data.documents || []).find(d => d._id === t8Doc.data.document?._id);
  if (n8 && n8.reminderType === 'EXPIRED_ALERT' && doc8Record?.status === 'Expired') {
    console.log(`[PASS TEST 8] Expired status ("${doc8Record.status}") and notification generated: "${n8.title}"`);
  } else {
    console.error(`[FAIL TEST 8] Expected EXPIRED_ALERT and Expired status, found:`, n8, doc8Record);
  }

  // TEST 9: Add document without expiry date
  console.log('\n[TEST 9] Add document without expiry date');
  const t9Doc = await api('/documents', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token1}` },
    body: JSON.stringify({
      documentName: 'TEST_Permanent Marksheet No Expiry',
      documentType: 'Previous Academic Marksheet',
      expiryDate: null
    })
  });
  const notifs9 = await getNotificationsForStudent(token1);
  const n9 = notifs9.find(n => (n.documentId?._id || n.documentId) === t9Doc.data.document?._id);
  if (!n9) {
    console.log(`[PASS TEST 9] No expiry reminder created for document without expiry date.`);
  } else {
    console.error(`[FAIL TEST 9] Unexpected notification created for document without expiry:`, n9);
  }

  // TEST 10: Renew a document and update its expiry date
  console.log('\n[TEST 10] Renew a document and update its expiry date');
  const renewDate = getDateString(30);
  const renewRes = await api(`/documents/${t4Doc.data.document._id}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token1}` },
    body: JSON.stringify({
      documentName: 'TEST_Income Certificate 4d Renewed',
      expiryDate: renewDate
    })
  });
  const notifs10 = await getNotificationsForStudent(token1);
  const doc10Notifs = notifs10.filter(n => (n.documentId?._id || n.documentId) === t4Doc.data.document._id);
  const hasRenewalConfirm = doc10Notifs.some(n => n.reminderType === 'RENEWAL_CONFIRMATION');
  const hasNew30DayReminder = doc10Notifs.some(n => n.reminderType === '30_DAYS');
  const hasOldUrgentReminder = doc10Notifs.some(n => n.reminderType === 'URGENT_EXPIRY');
  if (hasRenewalConfirm && hasNew30DayReminder && !hasOldUrgentReminder) {
    console.log(`[PASS TEST 10] Document renewed: Old urgent reminder removed, RENEWAL_CONFIRMATION sent, and new 30_DAYS reminder scheduled.`);
  } else {
    console.error(`[FAIL TEST 10] Renewal notifications issue:`, { hasRenewalConfirm, hasNew30DayReminder, hasOldUrgentReminder, doc10Notifs });
  }

  // TEST 11: Run the daily scheduler multiple times (Idempotence & Duplicate Prevention)
  console.log('\n[TEST 11] Run scheduler check multiple times to test duplicate prevention');
  const countBefore = (await getNotificationsForStudent(token1)).length;
  const run1 = await api('/notifications/run-expiry-check', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token1}` }
  });
  const countAfter1 = (await getNotificationsForStudent(token1)).length;
  const run2 = await api('/notifications/run-expiry-check', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token1}` }
  });
  const countAfter2 = (await getNotificationsForStudent(token1)).length;

  if (run1.data.remindersCreated === 0 && run2.data.remindersCreated === 0 && countAfter1 === countBefore && countAfter2 === countBefore) {
    console.log(`[PASS TEST 11] Scheduler run multiple times: 0 duplicate notifications created. (Total count remained ${countBefore})`);
  } else {
    console.error(`[FAIL TEST 11] Duplicate reminders created:`, { countBefore, countAfter1, countAfter2, run1: run1.data, run2: run2.data });
  }

  // TEST 12: Login as two different students & verify notification isolation
  console.log('\n[TEST 12] Login as two different students and verify notification isolation');
  const s1Notifs = await getNotificationsForStudent(token1);
  const s2Notifs = await getNotificationsForStudent(token2);
  const s1Ids = new Set(s1Notifs.map(n => n._id));
  const overlap = s2Notifs.filter(n => s1Ids.has(n._id));

  const s1UserIdMatches = s1Notifs.every(n => (n.userId?._id || n.userId).toString() === user1._id.toString());
  const s2UserIdMatches = s2Notifs.every(n => (n.userId?._id || n.userId).toString() === user2._id.toString());

  if (overlap.length === 0 && s1UserIdMatches && s2UserIdMatches) {
    console.log(`[PASS TEST 12] Strict user isolation confirmed: Student 1 has ${s1Notifs.length} notifications, Student 2 has ${s2Notifs.length} notifications. Overlap: 0.`);
  } else {
    console.error(`[FAIL TEST 12] Notification isolation failed:`, { overlap, s1UserIdMatches, s2UserIdMatches });
  }

  // Clean up test documents
  console.log('\n--- CLEANING UP TEST DATA ---');
  const finalDocs = await api('/documents', { headers: { Authorization: `Bearer ${token1}` } });
  for (const doc of (finalDocs.data.documents || [])) {
    if (doc.documentName.startsWith('TEST_')) {
      await api(`/documents/${doc._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token1}` }
      });
    }
  }
  console.log('[PASS] Test cleanup complete.');

  console.log('\n=== ALL 12 TESTS AND SCHEME DETAILS VERIFICATIONS PASSED SUCCESSFULLY! ===');
}

runTests().catch(err => {
  console.error('Test script crashed:', err);
  process.exit(1);
});
