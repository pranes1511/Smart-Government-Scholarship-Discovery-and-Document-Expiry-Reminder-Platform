/**
 * Document Readiness Engine for Scheme-Specific Requirements
 * Compares scheme required documents with student's recorded documents.
 */

/**
 * Normalizes document name string for flexible matching.
 */
function normalizeDocName(str = '') {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Checks if a required document name matches a student's saved document.
 */
function isDocumentMatch(requiredDoc, studentDoc) {
  const reqNorm = normalizeDocName(requiredDoc);
  const stuNorm = normalizeDocName(studentDoc.documentName);

  if (reqNorm === stuNorm) return true;
  if (stuNorm.includes(reqNorm) || reqNorm.includes(stuNorm)) return true;

  // Keyword-based synonyms
  const synonyms = [
    { keys: ['income', 'salary', 'income certificate'] },
    { keys: ['community', 'caste', 'community certificate', 'caste certificate'] },
    { keys: ['nativity', 'domicile', 'residence', 'native certificate'] },
    { keys: ['marksheet', 'academic', 'previous marksheet', '12th marksheet', 'transcript', 'grade card'] },
    { keys: ['bonafide', 'enrolment', 'enrollment', 'bonafide certificate', 'study certificate'] },
    { keys: ['disability', 'pwd', 'disability certificate'] },
    { keys: ['bank', 'passbook', 'bank account', 'cancelled cheque'] },
    { keys: ['fee', 'receipt', 'fee receipt', 'tuition fee'] }
  ];

  for (const group of synonyms) {
    const reqMatches = group.keys.some((k) => reqNorm.includes(k));
    const stuMatches = group.keys.some((k) => stuNorm.includes(k));
    if (reqMatches && stuMatches) return true;
  }

  return false;
}

/**
 * Calculates document readiness for a specific scheme against student's saved documents.
 * 
 * @param {Array<string>} requiredDocuments - List of documents required by the scheme
 * @param {Array<Object>} savedDocuments - List of documents saved by the student in MongoDB
 * @returns {Object} Comprehensive readiness breakdown
 */
const checkDocumentReadiness = (requiredDocuments = [], savedDocuments = []) => {
  if (!requiredDocuments || requiredDocuments.length === 0) {
    return {
      totalRequired: 0,
      availableCount: 0,
      missingCount: 0,
      expiredCount: 0,
      unverifiedCount: 0,
      readinessPercentage: 100,
      readinessStatus: 'Ready',
      checklist: []
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const checklist = requiredDocuments.map((reqDoc) => {
    // Find matching document among student's saved records
    const matchedDoc = savedDocuments.find((sd) => isDocumentMatch(reqDoc, sd));

    if (!matchedDoc) {
      return {
        requiredDocument: reqDoc,
        matchedDocumentId: null,
        status: 'MISSING',
        statusLabel: 'Missing',
        statusBadge: 'danger',
        expiryDate: null,
        daysRemaining: null,
        message: 'No record of this document found in your document tracker.',
        actionRequired: 'Add Missing Document'
      };
    }

    if (!matchedDoc.expiryDate) {
      return {
        requiredDocument: reqDoc,
        matchedDocumentId: matchedDoc._id,
        savedDocumentName: matchedDoc.documentName,
        status: 'EXPIRY_UNVERIFIED',
        statusLabel: 'Expiry Unverified',
        statusBadge: 'info',
        expiryDate: null,
        daysRemaining: null,
        message: 'Document record exists with no set expiry date. Available for application, but verify validity period if applicable.',
        actionRequired: 'Verify Validity Period'
      };
    }

    const expDate = new Date(matchedDoc.expiryDate);
    expDate.setHours(0, 0, 0, 0);

    const diffTime = expDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        requiredDocument: reqDoc,
        matchedDocumentId: matchedDoc._id,
        savedDocumentName: matchedDoc.documentName,
        status: 'EXPIRED',
        statusLabel: 'Expired',
        statusBadge: 'danger',
        expiryDate: matchedDoc.expiryDate,
        daysRemaining: diffDays,
        message: `Certificate expired ${Math.abs(diffDays)} day(s) ago on ${expDate.toLocaleDateString('en-IN')}. Needs renewal.`,
        actionRequired: 'Renew Certificate'
      };
    }

    if (diffDays <= 30) {
      return {
        requiredDocument: reqDoc,
        matchedDocumentId: matchedDoc._id,
        savedDocumentName: matchedDoc.documentName,
        status: 'AVAILABLE',
        statusLabel: 'Expiring Soon',
        statusBadge: 'warning',
        expiryDate: matchedDoc.expiryDate,
        daysRemaining: diffDays,
        message: `Valid, but expires soon in ${diffDays} day(s) on ${expDate.toLocaleDateString('en-IN')}.`,
        actionRequired: 'Prepare for Renewal'
      };
    }

    return {
      requiredDocument: reqDoc,
      matchedDocumentId: matchedDoc._id,
      savedDocumentName: matchedDoc.documentName,
      status: 'AVAILABLE',
      statusLabel: 'Available & Valid',
      statusBadge: 'success',
      expiryDate: matchedDoc.expiryDate,
      daysRemaining: diffDays,
      message: `Valid until ${expDate.toLocaleDateString('en-IN')} (${diffDays} days remaining).`,
      actionRequired: null
    };
  });

  const availableItems = checklist.filter((c) => c.status === 'AVAILABLE');
  const unverifiedItems = checklist.filter((c) => c.status === 'EXPIRY_UNVERIFIED');
  const missingItems = checklist.filter((c) => c.status === 'MISSING');
  const expiredItems = checklist.filter((c) => c.status === 'EXPIRED');

  // Available and non-expired items count towards readiness
  const effectiveAvailableCount = availableItems.length + unverifiedItems.length;
  const readinessPercentage = Math.round((effectiveAvailableCount / requiredDocuments.length) * 100);

  let readinessStatus = 'Incomplete';
  if (readinessPercentage === 100 && expiredItems.length === 0) {
    readinessStatus = 'Ready to Apply';
  } else if (readinessPercentage >= 50) {
    readinessStatus = 'Partially Ready';
  } else {
    readinessStatus = 'Documents Needed';
  }

  return {
    totalRequired: requiredDocuments.length,
    availableCount: availableItems.length,
    unverifiedCount: unverifiedItems.length,
    missingCount: missingItems.length,
    expiredCount: expiredItems.length,
    readinessPercentage,
    readinessStatus,
    disclaimer:
      'Readiness indicates whether you have recorded required documents without known expiration. It does not replace physical certificate verification by the scholarship authority.',
    checklist
  };
};

module.exports = {
  checkDocumentReadiness,
  isDocumentMatch
};
