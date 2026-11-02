# SchemeSathi — Smart Government Scheme Discovery and Document Expiry Reminder Platform

> **Target Audience:** College and University Students studying in India (Undergraduate, Postgraduate, Technical, and Professional Degrees).  
> **Tech Stack:** MERN Stack (MongoDB, Express.js, React.js, Node.js) with Bootstrap 5.

---

## 1. Project Overview & Problem Statement

Many college students across India miss out on government scholarships, tuition fee waivers, and welfare entitlements simply because:
1. They are unaware of schemes matching their specific academic, community, or financial profile.
2. Time-limited certificates (such as Income Certificates, Community/Caste validity, and Domicile Certificates) expire without the student noticing.
3. Complex, multi-page government notifications make it hard to tell which requirements are satisfied, which are missing, and which require verification.

**SchemeSathi** solves this problem through an integrated, privacy-focused student portal that provides:
- **Rule-Based Scheme Discovery:** Evaluates verified Central, Tamil Nadu, and State scholarships for college students without black-box AI.
- **Eligibility Gap Analysis:** Itemizes Satisfied, Missing, and Unverified conditions with clear next steps.
- **Document Expiry Register:** Tracks certificate validity with **zero confidential file uploads**.
- **Automated Expiry Alerts:** Scheduled in-app notifications **30, 15, and 7 days** before certificate expiry.
- **Document Readiness Checker:** Cross-checks required scheme documents against student records to compute application readiness.
- **Side-by-Side Scheme Comparison:** Compares up to 3 scholarships simultaneously.
- **Application Pipeline Tracker:** Manages milestones from *Interested* and *Preparing Documents* to *Submitted* and *Approved*.

---

## 2. Strict Technology Stack

- **Frontend:** HTML5, CSS3, JavaScript (ES6+), Bootstrap 5, Bootstrap Icons, React.js (Vite), React Router DOM v7, Native Fetch API.
- **Backend:** Node.js (v20+ / v24+), Express.js.
- **Database:** MongoDB & Mongoose ORM (Supports standard MongoDB URI + automatic embedded `MongoMemoryServer` fallback for zero-config out-of-the-box local execution).
- **Authentication & Security:** bcryptjs (password hashing, salt rounds 10), jsonwebtoken (JWT Bearer tokens), CORS.
- **Scheduler:** `node-cron` for automated daily calendar-based document expiry checks.

---

## 3. System Architecture & Folder Structure

```
Student_Scheme_Discovery_Platform/
├── client/                               # React 19 Frontend (Vite + Bootstrap 5)
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── assets/                      # Static logos and graphic assets
│   │   ├── components/                  # Reusable UI components
│   │   │   ├── Navbar.jsx               # Navigation bar with user dropdown
│   │   │   ├── Sidebar.jsx              # Dashboard navigation sidebar
│   │   │   ├── Footer.jsx               # Portal footer and privacy guarantee
│   │   │   ├── ProtectedRoute.jsx       # Route guard for authenticated pages
│   │   │   ├── SchemeCard.jsx           # Scholarship card with eligibility badge
│   │   │   ├── DocumentCard.jsx         # Certificate card with expiry status
│   │   │   ├── NotificationBell.jsx     # Live unread alerts dropdown
│   │   │   ├── EligibilityBadge.jsx     # Color-coded eligibility pill badges
│   │   │   ├── LoadingSpinner.jsx       # Spinner component
│   │   │   └── EmptyState.jsx           # Zero-data feedback component
│   │   ├── context/
│   │   │   └── AuthContext.jsx          # JWT authentication context
│   │   ├── pages/                       # 8 Module Pages + Auth & Landing
│   │   │   ├── Landing.jsx              # Hero banner, features, how it works
│   │   │   ├── Register.jsx             # Student registration form
│   │   │   ├── Login.jsx                # Student login form
│   │   │   ├── Dashboard.jsx            # Live dynamic MongoDB metrics
│   │   │   ├── StudentProfile.jsx       # Personal, Academic & Financial info
│   │   │   ├── SchemeDiscovery.jsx      # Search, multi-facet filters & sorting
│   │   │   ├── SchemeDetails.jsx        # Complete scheme specifications
│   │   │   ├── EligibilityAnalysis.jsx  # Satisfied, Missing & Unverified breakdown
│   │   │   ├── DocumentTracker.jsx      # Document validity register & renewal
│   │   │   ├── DocumentReadiness.jsx    # Scheme-specific checklist & score
│   │   │   ├── SchemeComparison.jsx     # 3-scheme side-by-side comparison matrix
│   │   │   ├── ApplicationTracker.jsx   # Visual milestone progress tracker
│   │   │   └── Notifications.jsx        # In-app notification center
│   │   ├── services/
│   │   │   └── api.js                   # Centralized Fetch API client
│   │   ├── styles/
│   │   │   ├── global.css               # Design tokens, color palette, badges
│   │   │   ├── dashboard.css            # Sidebar, stat cards, comparison table
│   │   │   └── components.css           # Navbar, scheme cards, empty states
│   │   ├── App.jsx                      # App root router
│   │   └── main.jsx                     # Vite root entry
│   ├── package.json
│   ├── .env
│   └── .env.example
├── server/                               # Node.js + Express Backend
│   ├── config/
│   │   └── db.js                        # Resilient MongoDB connection
│   ├── models/                          # Mongoose ODM schemas
│   │   ├── User.js                      # Student login and account schema
│   │   ├── StudentProfile.js            # Comprehensive student profile
│   │   ├── Scheme.js                    # Scholarship schema with structured rules
│   │   ├── StudentDocument.js           # Strict zero-PII document register
│   │   ├── Application.js               # Application milestone tracking
│   │   └── Notification.js              # Idempotent expiry notifications
│   ├── controllers/                     # Business logic controllers
│   │   ├── authController.js
│   │   ├── profileController.js
│   │   ├── schemeController.js
│   │   ├── documentController.js
│   │   ├── applicationController.js
│   │   ├── notificationController.js
│   │   └── dashboardController.js
│   ├── routes/                          # REST API route declarations
│   │   ├── authRoutes.js
│   │   ├── profileRoutes.js
│   │   ├── schemeRoutes.js
│   │   ├── documentRoutes.js
│   │   ├── applicationRoutes.js
│   │   ├── notificationRoutes.js
│   │   └── dashboardRoutes.js
│   ├── middleware/
│   │   └── authMiddleware.js            # JWT bearer token verification
│   ├── utils/                           # Core algorithmic engines
│   │   ├── eligibilityEngine.js         # Deterministic rule matching engine
│   │   ├── documentReadiness.js         # Scheme document cross-checker
│   │   └── reminderService.js           # Daily cron & 30/15/7-day alerts
│   ├── data/
│   │   └── schemes.json                 # Verified scholarship dataset
│   ├── scripts/
│   │   └── seedSchemes.js               # Idempotent MongoDB seed runner
│   ├── server.js                        # Express server entry point
│   ├── package.json
│   ├── .env
│   └── .env.example
├── .gitignore
└── README.md
```

---

## 4. Strict Zero-Storage Document Privacy Guarantee

Under the strict privacy requirements of this platform:
- **No confidential files stored:** The application **never** collects, requests, uploads, or stores Aadhaar cards, certificate numbers, serial numbers, scanned copies, images, or PDF documents.
- **Data storage strictly limited to:**
  ```json
  {
    "userId": "ObjectId(...)",
    "documentName": "Income Certificate",
    "documentType": "Revenue Certificate",
    "expiryDate": "2027-05-20T00:00:00.000Z",
    "createdAt": "2026-11-01T18:00:00.000Z",
    "updatedAt": "2026-11-01T18:00:00.000Z"
  }
  ```
- Lifetime documents (e.g., 10th/12th Marksheets or permanent Caste Certificates) store `expiryDate: null`.

---

## 5. Rule-Based Eligibility Engine (`eligibilityEngine.js`)

Unlike black-box AI systems, SchemeSathi utilizes a **deterministic, rule-based matching engine**. Each condition is evaluated individually:

### Condition Results:
- **`SATISFIED`:** Student profile matches or exceeds criteria (e.g., Annual Income ₹1,80,000 &le; ₹2,50,000 ceiling).
- **`NOT_SATISFIED`:** Profile data violates criteria (e.g., Academic percentage 55% &lt; 60% threshold).
- **`UNVERIFIED`:** Student has not yet entered this field in their profile (never assumed satisfied!).

### Overall Scheme Eligibility Status:
1. **Potentially Eligible:** All evaluated mandatory conditions are satisfied with zero failed mandatory rules.
2. **Partially Eligible:** Most criteria are met, with non-critical criteria requiring verification.
3. **Needs Verification:** Crucial mandatory criteria (e.g., family income or caste category) are missing from the student profile.
4. **Not Eligible:** One or more mandatory eligibility conditions have failed.

---

## 6. Automatic Document Expiry Reminders (`reminderService.js`)

### Reminder Intervals:
- **30 Days Before Expiry (`30_DAYS`)**: First notification advising student to prepare renewal documents.
- **15 Days Before Expiry (`15_DAYS`)**: Second notification alerting student of impending certificate lapse.
- **7 Days Before Expiry (`7_DAYS`)**: Urgent alert to submit renewal at revenue/e-Sevai office.
- **Expired Alert (`EXPIRED_ALERT`)**: Triggered if expiry date passes without renewal.

### Idempotency & Renewal Recalculation:
- Compound unique index on MongoDB: `{ userId: 1, documentId: 1, reminderType: 1, expiryDate: 1 }`.
- When a student updates the certificate expiry date (renewal), past notifications for the previous expiry date are invalidated, and new reminders are scheduled automatically.

---

## 7. REST API Documentation

| Method | Endpoint | Access | Description |
|---|---|---|---|
| **POST** | `/api/auth/register` | Public | Register new college student account |
| **POST** | `/api/auth/login` | Public | Authenticate student and obtain JWT token |
| **GET** | `/api/auth/me` | Protected | Get current student account info |
| **GET** | `/api/profile` | Protected | Retrieve full student profile |
| **PUT** | `/api/profile` | Protected | Update personal, academic & financial info |
| **GET** | `/api/schemes` | Optional Auth | List scholarships with search, filters & eligibility |
| **GET** | `/api/schemes/:id` | Optional Auth | Get scholarship details by ID or slug |
| **POST** | `/api/schemes/eligibility` | Protected | Generate full 3-column eligibility gap analysis |
| **GET** | `/api/schemes/recommended` | Protected | Get top personalized scholarship recommendations |
| **POST** | `/api/schemes/compare` | Optional Auth | Compare up to 3 scholarships side-by-side |
| **GET** | `/api/documents` | Protected | List saved document records with expiry status |
| **POST** | `/api/documents` | Protected | Add new document record (No file upload) |
| **PUT** | `/api/documents/:id` | Protected | Update document name or renew expiry date |
| **DELETE**| `/api/documents/:id` | Protected | Delete document record and linked alerts |
| **GET** | `/api/documents/readiness/:schemeId` | Protected | Compute scheme-specific document readiness score |
| **GET** | `/api/applications` | Protected | List tracked scholarship applications |
| **POST** | `/api/applications` | Protected | Track a new scholarship application |
| **PUT** | `/api/applications/:id` | Protected | Update status, milestone notes, or deadline |
| **DELETE**| `/api/applications/:id` | Protected | Delete tracked application record |
| **GET** | `/api/notifications` | Protected | Retrieve all in-app expiry notifications |
| **GET** | `/api/notifications/unread-count` | Protected | Get count of unread reminders |
| **PUT** | `/api/notifications/:id/read` | Protected | Mark single notification as read |
| **PUT** | `/api/notifications/read-all` | Protected | Mark all student notifications as read |
| **GET** | `/api/dashboard` | Protected | Retrieve live dynamic MongoDB metrics |
| **GET** | `/api/health` | Public | Health check API |

---

## 8. Installation & Setup Instructions

### Prerequisites
- **Node.js** (v18.0.0 or higher; v20/v24 recommended)
- **npm** (v9.0.0 or higher)
- **MongoDB** (Optional: local MongoDB daemon on port `27017` or MongoDB Atlas URI; if not present, the backend automatically uses embedded `MongoMemoryServer` with zero manual configuration!)

### Step 1: Clone or Navigate to Project
```bash
cd "e:/fsd project/Student_Scheme_Discovery_Platform"
```

### Step 2: Configure Environment Variables

**Server Configuration (`server/.env`):**
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/student_schemes
JWT_SECRET=supersecret_jwt_key_student_scheme_platform_2026
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

**Client Configuration (`client/.env`):**
```env
VITE_API_URL=http://localhost:5000/api
```

### Step 3: Install Dependencies
```bash
# Install Server Dependencies
cd server
npm install

# Install Client Dependencies
cd ../client
npm install
```

### Step 4: Seed Initial Scholarship Catalogue
```bash
cd ../server
npm run seed
```
*(Note: The server also auto-seeds `schemes.json` on first startup if the database is empty).*

---

## 9. Running Frontend and Backend

Open two separate terminal windows:

### Terminal 1: Backend Server (Port 5000)
```bash
cd "e:/fsd project/Student_Scheme_Discovery_Platform/server"
npm start
```
*Output will display:*
```
[Database] Connected successfully to MongoDB / embedded MongoMemoryServer
[Server Startup] Auto-seeded 12 verified government schemes.
[Reminder Service] Daily document expiry cron scheduler initialized (0 0 * * *).
=======================================================
  Student Scheme Discovery & Document Reminder Server   
  Running on: http://localhost:5000                 
  Health API: http://localhost:5000/api/health      
=======================================================
```

### Terminal 2: Frontend Client (Port 5173)
```bash
cd "e:/fsd project/Student_Scheme_Discovery_Platform/client"
npm run dev
```
*Accessible in browser at:*
```
http://localhost:5173/
```

---

## 10. Default Login Credentials

### Administrator Portal Account:
- **Login URL:** [http://localhost:5173/login](http://localhost:5173/login) (redirects to `/admin`)
- **Email:** `admin@schemesathi.gov.in`
- **Password:** `adminpassword123`
- **Privileges:** Manage scholarships (Add/Edit/Delete), update portal schemes, view registered students directory, and monitor system metrics.

### Demo Student Account (Pre-configured Profile):
- **Email:** `ananya.ramesh@college.edu`
- **Password:** `password123`
- **Profile:** PSG College of Technology, B.Tech IT (Year 2), Tamil Nadu, BC, Income: ₹1,80,000, 84.5%, Govt School = Yes.
- **Preloaded Matches:** 8 Potentially Eligible scholarships, active tracker, and registered income certificate.

### Alternative Student Account:
- **Email:** `kavitha.test@college.edu`
- **Password:** `password123`


---

## 10. Automated Testing Instructions

To run the end-to-end integration test verifying all 10 API workflows:
```bash
cd "e:/fsd project/Student_Scheme_Discovery_Platform"
node -e "
(async () => {
  const res = await fetch('http://localhost:5000/api/health');
  console.log('Server health:', await res.json());
})();
"
```

---

## 11. Initial Verified Scholarship Catalogue

The initial database is seeded with authentic college welfare schemes:
1. **PM-USP Central Sector Scholarship Scheme for College and University Students** (Ministry of Education)
2. **AICTE Pragati Scholarship Scheme for Girl Students (Degree)** (AICTE, MoE)
3. **AICTE Saksham Scholarship Scheme for Specially Abled Students (Degree)** (AICTE)
4. **AICTE Swanath Scholarship Scheme** (AICTE)
5. **Post-Matric Scholarship for Scheduled Caste (SC) Students** (MSJE)
6. **Post-Matric Scholarship for Other Backward Classes (OBC) Students** (MSJE)
7. **Ishan Uday Special Scholarship Scheme for North Eastern Region (NER)** (UGC)
8. **Moovalur Ramamirtham Ammaiyar Higher Education Assurance Scheme (Puthumai Penn)** (Tamil Nadu Govt)
9. **Tamil Nadu 7.5% Government School Quota Professional College Fee Exemption** (Tamil Nadu Govt)
10. **Tamil Nadu BC, MBC & DNC Welfare Post-Matric Scholarship** (Tamil Nadu Govt)
11. **Merit-cum-Means Scholarship for Professional and Technical Courses CS (Minorities)** (MoMA)
12. **Central Sector Interest Subsidy Scheme (CSIS) on Education Loans** (Ministry of Education)

---

## 12. License & Author
Built for college students across India to maximize higher education scholarship discovery and certificate validity awareness.
