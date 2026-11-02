/**
 * Rule-Based Eligibility Engine for College Student Welfare Schemes
 * Pure JavaScript rule evaluation with zero AI/ML dependency.
 */

/**
 * Evaluates a single eligibility rule against student profile data.
 * @param {Object} rule - Rule object { field, operator, value, label, mandatory, explanationOnFail, nextStepTip }
 * @param {Object} profile - Student profile data
 * @returns {Object} Condition result { conditionName, requiredValue, studentValue, status, explanation, nextStep, mandatory }
 */
const evaluateCondition = (rule, profile = {}) => {
  const {
    field,
    operator,
    value: requiredVal,
    label,
    mandatory = true,
    explanationOnFail = '',
    nextStepTip = ''
  } = rule;

  let studentVal;
  // Support nested fields e.g., additionalEligibilityInformation.isPersonWithDisability
  if (field.includes('.')) {
    const parts = field.split('.');
    studentVal = parts.reduce((acc, part) => (acc ? acc[part] : undefined), profile);
  } else if (field in profile) {
    studentVal = profile[field];
  } else if (
    profile.additionalEligibilityInformation &&
    field in profile.additionalEligibilityInformation
  ) {
    studentVal = profile.additionalEligibilityInformation[field];
  }

  // Check if student profile data is missing or unprovided
  const isMissing =
    studentVal === undefined ||
    studentVal === null ||
    studentVal === '' ||
    (typeof studentVal === 'number' && isNaN(studentVal));

  if (isMissing) {
    return {
      conditionName: label || field,
      field,
      requiredValue: formatValueForDisplay(requiredVal, operator),
      studentValue: 'Not Provided in Profile',
      status: 'UNVERIFIED',
      mandatory,
      explanation: `Information for "${label || field}" is not currently available in your student profile.`,
      nextStep: nextStepTip || `Update your student profile to add your ${label || field}.`
    };
  }

  let isSatisfied = false;
  let customFailReason = explanationOnFail;

  switch (operator) {
    case 'lte': {
      const numStudent = Number(studentVal);
      const numReq = Number(requiredVal);
      isSatisfied = !isNaN(numStudent) && numStudent <= numReq;
      if (!isSatisfied) {
        customFailReason =
          customFailReason ||
          `Current value (₹${numStudent.toLocaleString('en-IN')}) exceeds maximum allowed ceiling of ₹${numReq.toLocaleString('en-IN')}.`;
      }
      break;
    }
    case 'gte': {
      const numStudent = Number(studentVal);
      const numReq = Number(requiredVal);
      isSatisfied = !isNaN(numStudent) && numStudent >= numReq;
      if (!isSatisfied) {
        customFailReason =
          customFailReason ||
          `Academic score of ${numStudent}% is below required minimum threshold of ${numReq}%.`;
      }
      break;
    }
    case 'eq': {
      const sStr = String(studentVal).trim().toLowerCase();
      const rStr = String(requiredVal).trim().toLowerCase();
      isSatisfied = sStr === rStr || rStr === 'all' || rStr === 'any';
      if (!isSatisfied) {
        customFailReason =
          customFailReason ||
          `Expected "${requiredVal}", but your profile has "${studentVal}".`;
      }
      break;
    }
    case 'in': {
      const allowed = Array.isArray(requiredVal)
        ? requiredVal.map((v) => String(v).trim().toLowerCase())
        : [String(requiredVal).trim().toLowerCase()];
      const sStr = String(studentVal).trim().toLowerCase();
      isSatisfied =
        allowed.includes('all') ||
        allowed.includes('any') ||
        allowed.includes('all india') ||
        allowed.includes(sStr);
      if (!isSatisfied) {
        customFailReason =
          customFailReason ||
          `Allowed categories/values: [${Array.isArray(requiredVal) ? requiredVal.join(', ') : requiredVal}], but profile has "${studentVal}".`;
      }
      break;
    }
    case 'nin': {
      const disallowed = Array.isArray(requiredVal)
        ? requiredVal.map((v) => String(v).trim().toLowerCase())
        : [String(requiredVal).trim().toLowerCase()];
      const sStr = String(studentVal).trim().toLowerCase();
      isSatisfied = !disallowed.includes(sStr);
      if (!isSatisfied) {
        customFailReason =
          customFailReason ||
          `Profile value "${studentVal}" is not permitted under this criterion.`;
      }
      break;
    }
    case 'boolean_eq': {
      const bStudent = Boolean(studentVal);
      const bReq = Boolean(requiredVal);
      isSatisfied = bStudent === bReq;
      if (!isSatisfied) {
        customFailReason =
          customFailReason ||
          `Condition requires ${bReq ? 'Yes' : 'No'}, but profile indicates ${bStudent ? 'Yes' : 'No'}.`;
      }
      break;
    }
    default:
      isSatisfied = false;
      customFailReason = 'Unknown eligibility rule operator.';
  }

  return {
    conditionName: label || field,
    field,
    requiredValue: formatValueForDisplay(requiredVal, operator),
    studentValue: formatStudentValueForDisplay(studentVal),
    status: isSatisfied ? 'SATISFIED' : 'NOT_SATISFIED',
    mandatory,
    explanation: isSatisfied
      ? (field === 'annualFamilyIncome' ? 'Income within limit.' : field === 'academicPercentage' ? 'Marks requirement met.' : 'Criteria satisfied.')
      : (customFailReason || 'Requirement not met.'),
    nextStep: isSatisfied
      ? 'Requirement fulfilled.'
      : (nextStepTip || 'Review requirements or update profile.')
  };
};

/**
 * Formats required rule value for student-friendly UI display.
 */
function formatValueForDisplay(val, op) {
  if (op === 'lte') return `Maximum ₹${Number(val).toLocaleString('en-IN')}`;
  if (op === 'gte') return `Minimum ${val}%`;
  if (op === 'boolean_eq') return val ? 'Required: Yes' : 'Required: No';
  if (Array.isArray(val)) return val.join(' / ');
  return String(val);
}

/**
 * Formats student's value for UI display.
 */
function formatStudentValueForDisplay(val) {
  if (typeof val === 'boolean') return val ? 'Yes' : 'No';
  if (typeof val === 'number') return val.toLocaleString('en-IN');
  return String(val);
}

/**
 * Evaluates a scheme against a student's profile.
 * Returns categorized gap analysis and overall eligibility.
 * 
 * Overall Eligibility Statuses:
 * - 'Potentially Eligible'
 * - 'Partially Eligible'
 * - 'Not Eligible'
 * - 'Needs Verification'
 * 
 * @param {Object} scheme - Scheme model or plain object
 * @param {Object} profile - Student profile model or plain object
 * @returns {Object} Comprehensive evaluation breakdown
 */
const evaluateSchemeEligibility = (scheme, profile = {}) => {
  const rules = scheme.eligibilityRules || [];

  const satisfiedRequirements = [];
  const missingRequirements = [];
  const unverifiedRequirements = [];

  // Evaluate each condition
  for (const rule of rules) {
    const result = evaluateCondition(rule, profile);
    if (result.status === 'SATISFIED') {
      satisfiedRequirements.push(result);
    } else if (result.status === 'NOT_SATISFIED') {
      missingRequirements.push(result);
    } else {
      unverifiedRequirements.push(result);
    }
  }

  // Also verify general state applicability if not covered by a rule
  if (scheme.applicableStates && scheme.applicableStates.length > 0) {
    const isStateRulePresent = rules.some((r) => r.field === 'state');
    if (!isStateRulePresent) {
      const allowedStates = scheme.applicableStates;
      const isAllIndia =
        allowedStates.includes('All India') ||
        allowedStates.includes('All') ||
        allowedStates.includes('National');

      if (!isAllIndia) {
        if (!profile.state) {
          unverifiedRequirements.push({
            conditionName: 'State Domicile / Residence',
            field: 'state',
            requiredValue: allowedStates.join(', '),
            studentValue: 'Not Provided in Profile',
            status: 'UNVERIFIED',
            mandatory: true,
            explanation: `Scheme is limited to students residing in: ${allowedStates.join(', ')}.`,
            nextStep: 'Update your state of residence in your profile.'
          });
        } else if (allowedStates.map((s) => s.toLowerCase()).includes(profile.state.toLowerCase())) {
          satisfiedRequirements.push({
            conditionName: 'State Domicile / Residence',
            field: 'state',
            requiredValue: allowedStates.join(', '),
            studentValue: profile.state,
            status: 'SATISFIED',
            mandatory: true,
            explanation: `Your state (${profile.state}) is eligible for this scheme.`,
            nextStep: 'Keep domicile/nativity certificate ready.'
          });
        } else {
          missingRequirements.push({
            conditionName: 'State Domicile / Residence',
            field: 'state',
            requiredValue: allowedStates.join(', '),
            studentValue: profile.state,
            status: 'NOT_SATISFIED',
            mandatory: true,
            explanation: `Scheme is restricted to ${allowedStates.join(', ')}, but your state is ${profile.state}.`,
            nextStep: 'Check state-specific schemes available for your state.'
          });
        }
      }
    }
  }

  // Determine overall eligibility status
  let overallStatus = 'Potentially Eligible';
  let overallSummary = '';

  const hasMandatoryFailure = missingRequirements.some((c) => c.mandatory);

  if (hasMandatoryFailure) {
    overallStatus = 'Not Eligible';
    overallSummary = `${missingRequirements.length} criteria not met.`;
  } else if (unverifiedRequirements.length > 0) {
    const hasUnverifiedMandatory = unverifiedRequirements.some((c) => c.mandatory);
    if (satisfiedRequirements.length > 0 && !hasUnverifiedMandatory) {
      overallStatus = 'Partially Eligible';
      overallSummary = `${satisfiedRequirements.length} satisfied, ${unverifiedRequirements.length} unverified.`;
    } else if (satisfiedRequirements.length > 0 && hasUnverifiedMandatory) {
      overallStatus = 'Needs Verification';
      overallSummary = `${unverifiedRequirements.length} mandatory criteria unverified.`;
    } else {
      overallStatus = 'Needs Verification';
      overallSummary = 'Profile information required.';
    }
  } else if (satisfiedRequirements.length === 0 && rules.length === 0) {
    overallStatus = 'Potentially Eligible';
    overallSummary = 'General eligibility scheme - open to eligible students.';
  } else {
    overallStatus = 'Potentially Eligible';
    overallSummary = `${satisfiedRequirements.length} of ${satisfiedRequirements.length} criteria satisfied.`;
  }

  return {
    schemeId: scheme._id || scheme.id,
    schemeName: scheme.name,
    overallStatus,
    overallSummary,
    disclaimer:
      'Preliminary rule-based assessment. Check official portal before applying.',
    counts: {
      total: satisfiedRequirements.length + missingRequirements.length + unverifiedRequirements.length,
      satisfied: satisfiedRequirements.length,
      missing: missingRequirements.length,
      unverified: unverifiedRequirements.length
    },
    satisfiedRequirements,
    missingRequirements,
    unverifiedRequirements
  };
};

module.exports = {
  evaluateCondition,
  evaluateSchemeEligibility
};
