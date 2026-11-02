const BASE_URL = 'http://localhost:5000/api';

async function testExactPromptExample() {
  const adminLogin = await (await fetch(BASE_URL + '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@schemesathi.gov.in', password: 'adminpassword123' })
  })).json();
  const studentLogin = await (await fetch(BASE_URL + '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'ananya.ramesh@college.edu', password: 'password123' })
  })).json();

  console.log('1. Admin creates scheme: National Scholarship For Post Graduate Studies (Merit Based Scheme)');
  const createRes = await (await fetch(BASE_URL + '/schemes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + adminLogin.token },
    body: JSON.stringify({
      name: 'National Scholarship For Post Graduate Studies (Merit Based Scheme)',
      category: 'Merit-based',
      ministry: 'Ministry of Education / UGC',
      description: 'National financial support for students pursuing full-time post-graduate studies across recognized universities.',
      detailedDescription: 'Provides merit-based financial assistance to postgraduate university students.',
      applicableStates: ['All India'],
      officialUrl: 'https://scholarships.gov.in',
      applicationDeadline: '2026-12-31',
      applicationStatus: 'Open',
      benefits: ['₹15,000 per month for 2 years'],
      requiredDocuments: ['Degree Certificate', 'Aadhaar Card', 'Income Certificate']
    })
  })).json();

  const schemeId = createRes.scheme._id;
  console.log('Created scheme ID:', schemeId, 'Initial verificationStatus:', createRes.scheme.verificationStatus);

  // Student checks in discovery list and details
  let sDiscovery = await (await fetch(BASE_URL + '/schemes', {
    headers: { Authorization: 'Bearer ' + studentLogin.token }
  })).json();
  let foundScheme = sDiscovery.schemes.find(s => s._id === schemeId);
  console.log('Student sees in discovery list:', foundScheme.verificationStatus);

  let sRes = await (await fetch(BASE_URL + '/schemes/' + schemeId, {
    headers: { Authorization: 'Bearer ' + studentLogin.token }
  })).json();
  console.log('Student sees in scheme details:', sRes.scheme.verificationStatus);

  // 2. Admin verifies
  console.log('\n2. Admin updates verificationStatus to "Verified"');
  await fetch(BASE_URL + '/admin/schemes/' + schemeId + '/verification', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + adminLogin.token },
    body: JSON.stringify({ verificationStatus: 'Verified', officialUrl: 'https://scholarships.gov.in' })
  });
  sRes = await (await fetch(BASE_URL + '/schemes/' + schemeId, {
    headers: { Authorization: 'Bearer ' + studentLogin.token }
  })).json();
  console.log('Student sees after Admin Verified:', sRes.scheme.verificationStatus);
  if (sRes.scheme.verificationStatus !== 'Verified') throw new Error('Expected Verified');

  // 3. Admin updates to Needs Verification
  console.log('\n3. Admin updates verificationStatus to "Needs Verification"');
  await fetch(BASE_URL + '/admin/schemes/' + schemeId + '/verification', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + adminLogin.token },
    body: JSON.stringify({ verificationStatus: 'Needs Verification', officialUrl: 'https://scholarships.gov.in' })
  });
  sRes = await (await fetch(BASE_URL + '/schemes/' + schemeId, {
    headers: { Authorization: 'Bearer ' + studentLogin.token }
  })).json();
  console.log('Student sees after Admin Needs Verification:', sRes.scheme.verificationStatus);
  if (sRes.scheme.verificationStatus !== 'Needs Verification') throw new Error('Expected Needs Verification');

  // 4. Admin updates to Outdated
  console.log('\n4. Admin updates verificationStatus to "Outdated"');
  await fetch(BASE_URL + '/admin/schemes/' + schemeId + '/verification', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + adminLogin.token },
    body: JSON.stringify({ verificationStatus: 'Outdated', officialUrl: 'https://scholarships.gov.in' })
  });
  sRes = await (await fetch(BASE_URL + '/schemes/' + schemeId, {
    headers: { Authorization: 'Bearer ' + studentLogin.token }
  })).json();
  console.log('Student sees after Admin Outdated:', sRes.scheme.verificationStatus);
  if (sRes.scheme.verificationStatus !== 'Outdated') throw new Error('Expected Outdated');

  console.log('\n>>> EXACT PROMPT SCENARIO VERIFIED 100% SUCCEEDED! <<<');
}

testExactPromptExample().catch(err => {
  console.error(err);
  process.exit(1);
});
