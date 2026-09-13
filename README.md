# TeamPulse — Weekly Team Reporting, Performance Dashboard & AI Assistant

A full-stack enterprise MERN web application built for the **Sisenco Digital** technical assignment. Designed for structured weekly team reporting, manager review workflows, immutable version-controlled audit trails, executive team analytics, and an integrated Gemini-powered AI management assistant.

---

## Table of Contents

- [1. Executive Summary & Core Highlights](#1-executive-summary--core-highlights)
- [2. Roles & Permissions (RBAC Matrix)](#2-roles--permissions-rbac-matrix)
- [3. Report Workflow & Lifecycle State Machine](#3-report-workflow--lifecycle-state-machine)
- [4. Technology Stack](#4-technology-stack)
- [5. System Architecture & Component Design](#5-system-architecture--component-design)
- [6. Repository Directory Structure](#6-repository-directory-structure)
- [7. Prerequisites & System Requirements](#7-prerequisites--system-requirements)
- [8. Installation & Environment Setup](#8-installation--environment-setup)
- [9. Database Seeding & Development Accounts](#9-database-seeding--development-accounts)
- [10. Running the Application](#10-running-the-application)
- [11. Automated Testing & Verification](#11-automated-testing--verification)
- [12. REST API Specification](#12-rest-api-specification)
- [13. AI Management Assistant & Privacy Architecture](#13-ai-management-assistant--privacy-architecture)
- [14. Security, Privacy & Reliability Hardening](#14-security-privacy--reliability-hardening)
- [15. Documentation Index](#15-documentation-index)

---

## 1. Executive Summary & Core Highlights

TeamPulse solves the friction of fragmented status meetings, opaque project progress, and untracked deliverable revisions by providing a unified, auditable workspace for team members and managers.

### 🌟 Key Features

1. **Authentication & Session Security**:
   - Stateless JWT authentication delivered via **HTTP-only, SameSite cookies** (mitigating XSS and token exfiltration attacks).
   - Real-time session verification (`/api/auth/me`) on frontend reload with automatic redirection guards.

2. **Structured Weekly Progress Reporting**:
   - Multi-section report generator capturing:
     - **Tasks breakdown**: Name, priority (`LOW`, `MEDIUM`, `HIGH`, `URGENT`), planned vs. actual percentage, status (`NOT_STARTED`, `IN_PROGRESS`, `COMPLETED`, `BLOCKED`), planned vs. spent hours, and deliverables.
     - **Next week plans**: Task forecast, priorities, and implementation notes.
     - **Blockers & Impediments**: Categorized blockers with key issue flags.
     - **Key Achievements**: Milestone tracking with spotlight flags.
     - **Hours distribution**: Granular effort tracking by category.
     - **Resource links & General notes**: Supporting URLs and contextual commentary.

3. **Deterministic State Machine**:
   - Enforces valid lifecycle transitions: `DRAFT` $\rightarrow$ `SUBMITTED` $\rightarrow$ `NEEDS_CORRECTION` $\rightarrow$ `APPROVED`.
   - Prevents unauthorized edits once submitted or approved.

4. **Immutable Version Control & Audit Trail**:
   - Point-in-time report snapshots (`ReportVersion`) recorded on every submission (v1, v2, ...).
   - Side-by-side historical snapshot inspection with complete chronological audit records (`ReviewHistory`).

5. **Manager Review Inbox & Action Workflow**:
   - Centralized pending inbox for managers.
   - One-click approvals and mandatory-comment correction requests (`NEEDS_CORRECTION`).

6. **Project Directory & Member Allocation**:
   - Organization-wide project repository with categorized metadata (`Engineering`, `Design`, `Marketing`, etc.).
   - Dynamic member assignment and soft-archival capabilities.

7. **Team Directory & Account Administration**:
   - Team member listing with status toggles (`Active` / `Inactive`).
   - Built-in self-deactivation guard preventing managers from locking themselves out.

8. **Executive Analytics Dashboard**:
   - High-level KPI summary cards (Total Reports, Pending Reviews, Approved, Active Members).
   - Interactive Recharts visualization for weekly submission velocity trends.
   - Individual member performance and activity table.

9. **AI Management Assistant (Google Gemini 1.5 Flash)**:
   - Floating conversational assistant widget for managers.
   - Real-time Q&A, weekly team summaries, blocker identification, and workload analysis.
   - Zero-trust prompt sanitization and strict anti-hallucination system instructions.

10. **User Profile & Avatar Management**:
    - Custom profile picture upload with disk storage and magic-byte mime-type verification.
    - In-app password change workflow with bcrypt verification.

---

## 2. Roles & Permissions (RBAC Matrix)

The application enforces a strict dual-role access control model at both middleware and route levels:

| Capability / Resource | `TEAM_MEMBER` | `MANAGER_ADMIN` | Implementation Guard |
| :--- | :---: | :---: | :--- |
| **Create & Edit Own Drafts** | ✅ | ❌ *(Reviews only)* | `authorizeRoles('TEAM_MEMBER')` |
| **Submit Weekly Reports** | ✅ | ❌ | State check + version snapshot trigger |
| **View Own Reports & Snapshots** | ✅ | ✅ | Ownership check (`userId === req.user._id`) |
| **View Other Members' Reports** | ❌ *(Protected)* | ✅ | Anti-IDOR server-side filter |
| **Approve Submitted Reports** | ❌ | ✅ | `authorizeRoles('MANAGER_ADMIN')` |
| **Request Report Corrections** | ❌ | ✅ *(Mandatory comment)* | Zod validation + state transition |
| **Access Executive Dashboard** | ❌ | ✅ | `authorizeRoles('MANAGER_ADMIN')` |
| **Use Gemini AI Chat Assistant** | ❌ *(Hidden & Protected)*| ✅ | Backend role guard + prompt sanitization |
| **Create & Edit Projects** | ❌ | ✅ | `authorizeRoles('MANAGER_ADMIN')` |
| **Assign Members to Projects** | ❌ | ✅ | `authorizeRoles('MANAGER_ADMIN')` |
| **Manage Team Directory & Status**| ❌ | ✅ *(Self-guard)* | Self-deactivation prevention logic |
| **Update Own Profile & Avatar** | ✅ | ✅ | `authenticateUser` |

---

## 3. Report Workflow & Lifecycle State Machine

```
+-----------------------------------------------------------------------------+
|                          REPORT LIFECYCLE                                    |
+-----------------------------------------------------------------------------+

                     [ 1. CREATE DRAFT ]
                              │
                              ▼
                        ┌───────────┐
                        │   DRAFT   │ ◄─────────────────────────┐
                        └─────┬─────┘                           │
                              │ (Submit Report)                 │
                              ▼                                 │
                     [ Snapshot Version v1 ]                    │ (Author Revises)
                              │                                 │
                              ▼                                 │
                        ┌───────────┐                           │
                        │ SUBMITTED │                           │
                        └─────┬─────┘                           │
                              │                                 │
              ┌───────────────┴───────────────┐                 │
              │ (Manager Review)              │ (Request Changes│
              ▼                               ▼  with Feedback) │
        ┌───────────┐             ┌───────────────────┐         │
        │ APPROVED  │             │ NEEDS_CORRECTION  │ ────────┘
        └───────────┘             └───────────────────┘
     (Finalized & Locked)         (Feedback Visible to Author)
```

- **Draft State (`DRAFT`)**: Report is privately editable by the author. No manager review actions permitted.
- **Submitted State (`SUBMITTED`)**: An immutable snapshot (`ReportVersion`) is generated and locked. The report enters the Manager Review Inbox.
- **Needs Correction (`NEEDS_CORRECTION`)**: Manager provides mandatory feedback. The author can revise tasks, blockers, or hours, and resubmit (generating snapshot `v2`, `v3`, etc.).
- **Approved State (`APPROVED`)**: Manager finalizes the report. Content becomes read-only for all roles.

---

## 4. Technology Stack

### Frontend
- **Framework**: React 18 (Vite SPA)
- **Styling**: Tailwind CSS (Dark-mode palette, custom glassmorphism utilities)
- **Icons**: Lucide React
- **Routing**: React Router DOM v6 (Role-guarded routes via `<ProtectedRoute />`)
- **State Management**: React Context API (`AuthContext`, `ToastContext`)
- **HTTP Client**: Axios (Centralized interceptors, automatic error extraction, `withCredentials: true`)
- **Forms & Validation**: React Hook Form + Zod (`@hookform/resolvers`)
- **Data Visualizations**: Recharts (Weekly submission velocity line & bar charts)

### Backend
- **Runtime & Engine**: Node.js & Express.js
- **Database & ODM**: MongoDB & Mongoose v8
- **AI Intelligence Layer**: Google Generative AI SDK (`@google/generative-ai` / Gemini 1.5 Flash)
- **Authentication & Security**: JSON Web Tokens (`jsonwebtoken`), `cookie-parser`, `bcryptjs` (10 rounds)
- **Schema Validation**: Zod (Express validation middleware)
- **Test Framework**: Jest & Supertest (111 unit & integration tests)

---

## 5. System Architecture & Component Design

```
+-------------------------------------------------------------------------+
|                              CLIENT TIER                                |
|  React 18 SPA (Vite)  •  Tailwind CSS  •  Lucide Icons  •  Recharts     |
|  AuthContext  •  ToastContext  •  ProtectedRoute RBAC Guards            |
+-------------------------------------------------------------------------+
                                    │
               JSON over HTTP (HTTP-Only Secure Cookie)
                                    ▼
+-------------------------------------------------------------------------+
|                            APPLICATION TIER                             |
|  Express.js API Router (`/api/*`)                                       |
|  Middleware: CORS  •  CookieParser  •  AuthenticateUser  •  RBAC  •  Zod|
|                                                                         |
|  Controllers: Auth, Reports, Reviews, Projects, Users, Dashboard, AI    |
|  Services: Business Rules, State Machines, Context Retrieval & AI       |
+-------------------------------------------------------------------------+
                    │                               │
       Mongoose ODM Queries            Lightweight Sanitized Context
                    ▼                               ▼
+-----------------------+               +-----------------------+
|       DATA TIER       |               |       AI LAYER        |
|   MongoDB Database    |               | Google Gemini 1.5 API |
| 5 Indexed Collections |               |  (Zero-Trust Context) |
+-----------------------+               +-----------------------+
```

### Layered Separation of Concerns
1. **Routing Layer (`*.routes.js`)**: Maps HTTP verbs and endpoints to middlewares and controllers.
2. **Middleware Layer (`src/middleware/`)**:
   - `authenticateUser`: Decodes JWT cookie, verifies active account status in MongoDB, and attaches `req.user`.
   - `authorizeRoles`: Validates user role against allowed roles (`TEAM_MEMBER`, `MANAGER_ADMIN`).
   - `validate`: Validates incoming `req.body` against Zod schemas before hitting business logic.
   - `errorHandler` & `notFound`: Centralized error handling returning standardized `ApiResponse`.
3. **Controller Layer (`*.controller.js`)**: Extracts parameters/body, delegates to services, and formats JSON responses.
4. **Service Layer (`*.service.js`)**: Executes core business logic, status transitions, version snapshot generation, and audit logging.
5. **Model Layer (`src/models/`)**: Mongoose schemas with validation constraints, compound indexes, and hooks.

---

## 6. Repository Directory Structure

```text
├── backend/
│   ├── seed/
│   │   └── seedData.js              # Comprehensive demo dataset seeder
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js                # MongoDB Mongoose connection handler
│   │   │   └── env.js               # Environment variable validation & exports
│   │   ├── middleware/
│   │   │   ├── authenticateUser.js  # JWT cookie extraction & user session loader
│   │   │   ├── authorizeRoles.js    # Role-based access control guard
│   │   │   ├── errorHandler.js      # Global API error boundary
│   │   │   └── notFound.js          # 404 route handler
│   │   ├── models/
│   │   │   ├── Project.js           # Project metadata & assigned members
│   │   │   ├── Report.js            # Main weekly report document
│   │   │   ├── ReportVersion.js     # Immutable historical report snapshots
│   │   │   ├── ReviewHistory.js     # Review comments & audit timeline
│   │   │   └── User.js              # User accounts, credentials & roles
│   │   ├── modules/
│   │   │   ├── ai/                  # Gemini AI chat assistant module
│   │   │   ├── auth/                # Register, login, logout, session verification
│   │   │   ├── dashboard/           # Manager analytics KPIs & trend aggregation
│   │   │   ├── projects/            # Project CRUD & member assignment
│   │   │   ├── reports/             # Weekly report lifecycle, versions, drafts
│   │   │   ├── reviews/             # Manager review queue & approval actions
│   │   │   └── users/               # Team directory, profile & avatar management
│   │   ├── utils/
│   │   │   ├── ApiError.js          # Standardized operational error class
│   │   │   ├── ApiResponse.js       # Uniform JSON response structure
│   │   │   └── imageStorage.js      # Base64/buffer avatar processing
│   │   ├── app.js                   # Express application configuration
│   │   └── server.js                # HTTP server bootstrap entry point
│   ├── tests/                       # 111 Automated Jest & Supertest integration tests
│   │   ├── ai.test.js
│   │   ├── auth.test.js
│   │   ├── health.test.js
│   │   ├── models.test.js
│   │   ├── profile.test.js
│   │   ├── projects.test.js
│   │   ├── reports_and_reviews.test.js
│   │   └── users_and_dashboard.test.js
│   ├── .env.example
│   ├── package.json
│   └── README.md
├── frontend/
│   ├── public/                      # Static web assets
│   ├── src/
│   │   ├── components/
│   │   │   ├── ai/                  # Floating AIChatWidget & message bubbles
│   │   │   ├── common/              # Navbar, Sidebar, PageHeader, EmptyState, Modal
│   │   │   ├── reports/             # TaskFormArray, BlockerFormArray, HoursBreakdown
│   │   │   └── ui/                  # Badge, Button, Card, Input, Select, Spinner, Toast
│   │   ├── context/
│   │   │   ├── AuthContext.jsx      # Global authentication state & session bootstrap
│   │   │   └── ToastContext.jsx     # Floating toast notifications queue
│   │   ├── hooks/                   # Custom hooks (useAuth, useToast)
│   │   ├── layouts/
│   │   │   ├── AuthLayout.jsx       # Layout for login & registration pages
│   │   │   └── MainLayout.jsx       # Dashboard shell with responsive navigation
│   │   ├── pages/
│   │   │   ├── auth/                # LoginPage, RegisterPage
│   │   │   ├── manager/             # DashboardPage, ReviewInboxPage, ReviewDetailPage, ProjectsPage, TeamPage
│   │   │   ├── member/              # MyReportsPage, CreateReportPage, EditReportPage, ReportDetailPage
│   │   │   ├── ProfilePage.jsx      # User profile, avatar upload & password change
│   │   │   ├── StatusPage.jsx       # Real-time system health monitor
│   │   │   ├── UnauthorizedPage.jsx # Access forbidden error screen
│   │   │   └── NotFoundPage.jsx     # 404 page
│   │   ├── routes/
│   │   │   ├── AppRoutes.jsx        # Route declarations & hierarchy
│   │   │   └── ProtectedRoute.jsx   # Role-guarded route wrapper
│   │   ├── services/                # Axios API services (auth, reports, reviews, ai, etc.)
│   │   ├── utils/                   # Date formatters, status badge helpers
│   │   ├── App.jsx                  # Root application component
│   │   ├── index.css                # Tailwind CSS imports & global styles
│   │   └── main.jsx                 # React DOM mount point
│   ├── .env.example
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
├── docs/                            # In-depth architectural & design specifications
│   ├── ARCHITECTURE.md              # 3-tier architecture & design rationale
│   ├── PRESENTATION.md              # Slide deck & interview presentation guide
│   ├── ai-assistant.md              # AI Assistant prompt design & zero-trust privacy
│   ├── api-specification.md         # Comprehensive REST API reference
│   ├── authentication-and-rbac.md   # JWT session & security architecture
│   ├── database-design.md           # MongoDB schemas, relations & indexing
│   └── frontend-architecture.md     # Component hierarchy & state management
└── README.md
```

---

## 7. Prerequisites & System Requirements

Before running the application, ensure the following tools are installed:

- **Node.js**: `v18.x` or `v20.x` (LTS recommended)
- **npm**: `v9.x` or `v10.x`
- **MongoDB**: `v6.x` or `v7.x` (Local instance at `mongodb://localhost:27017` or MongoDB Atlas URI)
- **Google Gemini API Key** *(Optional / Recommended for AI Chat)*: Obtain a free API key from [Google AI Studio](https://aistudio.google.com/).

---

## 8. Installation & Environment Setup

### 1. Clone the Repository
```bash
git clone https://github.com/VikumBhashitha02/TodoList.git
cd TodoList
```

### 2. Configure Backend
```bash
cd backend
npm install
cp .env.example .env
```

Edit `backend/.env` with your environment values:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/team_report_dashboard
CORS_ORIGIN=http://localhost:5173
JWT_SECRET=super_secret_jwt_key_at_least_32_characters_long
JWT_EXPIRES_IN=1d
COOKIE_NAME=auth_token
GEMINI_API_KEY=your_gemini_api_key_here
```

> [!NOTE]
> **AI Fallback**: If `GEMINI_API_KEY` is not provided or invalid, the backend will return a helpful notification message without crashing the server.

### 3. Configure Frontend
```bash
cd ../frontend
npm install
cp .env.example .env
```

Edit `frontend/.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

---

## 9. Database Seeding & Development Accounts

Populate the database with realistic sample data (users, projects, draft reports, submitted reports, approved reports with version snapshots, and review history):

```bash
cd backend
npm run seed
```

### Pre-Configured Demo Accounts

| Role | Name | Email | Password | Pre-Loaded Data |
| :--- | :--- | :--- | :--- | :--- |
| **`MANAGER_ADMIN`** | Sarah Connor | `manager@example.com` | `Password123!` | Executive dashboard, review inbox, full management access |
| **`TEAM_MEMBER`** | Alex Rivera | `alex@example.com` | `Password123!` | Has approved reports, draft reports, and project assignments |
| **`TEAM_MEMBER`** | John Doe | `sarah@example.com` | `Password123!` | Has report currently pending manager review |

---

## 10. Running the Application

### Start the Backend Development Server
```bash
cd backend
npm run dev
# Server running at http://localhost:5000
# Health check available at http://localhost:5000/api/health
```

### Start the Frontend Client
```bash
cd frontend
npm run dev
# Application accessible at http://localhost:5173
```

---

## 11. Automated Testing & Verification

The backend includes a comprehensive automated test suite utilizing **Jest** and **Supertest** to validate end-to-end API workflows, database constraints, authentication security, version snapshots, and RBAC rules.

### Running Backend Tests
```bash
cd backend
npm test
```

### Test Suite Breakdown (111 Tests across 8 Suites)

```text
PASS tests/health.test.js
PASS tests/models.test.js
PASS tests/auth.test.js
PASS tests/profile.test.js
PASS tests/projects.test.js
PASS tests/reports_and_reviews.test.js
PASS tests/users_and_dashboard.test.js
PASS tests/ai.test.js

Test Suites: 8 passed, 8 total
Tests:       111 passed, 111 total
Snapshots:   0 total
Time:        ~14-16s
```

### Frontend Production Build Test
```bash
cd frontend
npm run build
# Compiles clean production bundle into frontend/dist/
```

---

## 12. REST API Specification

### Authentication (`/api/auth`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register new `TEAM_MEMBER` account |
| `POST` | `/api/auth/login` | Public | Authenticate user & issue HTTP-only JWT cookie |
| `POST` | `/api/auth/logout` | Public | Clear authentication session cookie |
| `GET` | `/api/auth/me` | Authenticated | Validate session and retrieve current user object |

### Reports (`/api/reports`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/reports` | Authenticated | List reports (members see own; managers see all with filters) |
| `GET` | `/api/reports/:id` | Authenticated | Get detailed report document |
| `GET` | `/api/reports/:id/versions` | Authenticated | Get immutable version history snapshots |
| `POST` | `/api/reports` | `TEAM_MEMBER` | Create a new report in `DRAFT` status |
| `PUT` | `/api/reports/:id` | `TEAM_MEMBER` | Update an existing `DRAFT` or `NEEDS_CORRECTION` report |
| `PATCH`| `/api/reports/:id/submit` | `TEAM_MEMBER` | Submit report for review (generates snapshot `v1+`) |
| `DELETE`| `/api/reports/:id` | `TEAM_MEMBER` | Delete a draft report |

### Manager Review Queue (`/api/reviews`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/reviews/pending` | `MANAGER_ADMIN` | Retrieve pending review queue |
| `GET` | `/api/reviews/:id/history` | `MANAGER_ADMIN` | Retrieve review audit log timeline |
| `PATCH`| `/api/reviews/:id/approve` | `MANAGER_ADMIN` | Approve submitted report |
| `PATCH`| `/api/reviews/:id/request-correction` | `MANAGER_ADMIN` | Request changes (mandatory comment required) |

### Projects (`/api/projects`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/projects` | Authenticated | List active projects |
| `GET` | `/api/projects/categories` | Authenticated | List distinct project categories |
| `POST` | `/api/projects` | `MANAGER_ADMIN` | Create a new project |
| `PUT` | `/api/projects/:id` | `MANAGER_ADMIN` | Update project name, category, or description |
| `PATCH`| `/api/projects/:id/members` | `MANAGER_ADMIN` | Assign or remove team members |
| `DELETE`| `/api/projects/:id` | `MANAGER_ADMIN` | Soft-deactivate/delete a project |

### Users & Profiles (`/api/users`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/users` | Authenticated | List team directory members |
| `PUT` | `/api/users/me` | Authenticated | Update current user profile (name) |
| `PATCH`| `/api/users/me/profile-picture`| Authenticated | Upload & update profile avatar |
| `DELETE`| `/api/users/me/profile-picture`| Authenticated | Remove custom avatar |
| `PATCH`| `/api/users/me/password` | Authenticated | Change account password (requires old password) |
| `PATCH`| `/api/users/:id/deactivate` | `MANAGER_ADMIN` | Deactivate team member account |
| `PATCH`| `/api/users/:id/reactivate` | `MANAGER_ADMIN` | Reactivate team member account |

### Executive Dashboard (`/api/dashboard`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/dashboard/stats` | `MANAGER_ADMIN` | Aggregated KPI statistics |
| `GET` | `/api/dashboard/trend` | `MANAGER_ADMIN` | Weekly submission velocity metrics |
| `GET` | `/api/dashboard/members` | `MANAGER_ADMIN` | Team member performance table |

### AI Management Assistant (`/api/ai`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/ai/chat` | `MANAGER_ADMIN` | Conversational Q&A and summary generation |

### System Health (`/api/health`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Public | Database connection status and server uptime |

---

## 13. AI Management Assistant & Privacy Architecture

The TeamPulse AI assistant utilizes Google's official **Gemini 1.5 Flash** model with a **zero-trust lightweight context retrieval strategy**:

```
[ Manager Prompt ]
        │
        ▼
[ Backend AIService ]
  ├── 1. Fetches active projects & assigned members
  ├── 2. Fetches recent weekly reports (tasks, spent hours, deliverables, blockers)
  ├── 3. Sanitizes user objects (EXCLUDES passwords, tokens, hashes)
  ├── 4. Injects Anti-Hallucination System Prompt
        │
        ▼
[ Gemini 1.5 Flash ] ───► [ Structured, Factual Markdown Response ]
```

### Anti-Hallucination Guardrails
- Operates at low temperature (`0.2`) for deterministic, strictly factual responses.
- Explicit instructions forbidding speculation, unrecorded task creation, or invented metrics.
- Returns explicit "data not found in current records" when queries exceed available reporting context.

---

## 14. Security, Privacy & Reliability Hardening

1. **Zero Client Token Storage**: JWT tokens reside solely in HTTP-only, `sameSite: 'lax'` cookies. JavaScript code running in the browser cannot read session tokens.
2. **Password Protection**: Passwords are encrypted with `bcryptjs` (10 salt rounds) and flagged with `select: false` in Mongoose schemas.
3. **Anti-IDOR Ownership Checks**: Members cannot query, edit, or submit reports belonging to other users.
4. **Self-Deactivation Guard**: Prevents managers from accidentally deactivating their own administrator accounts.
5. **Payload Validation**: Zod middleware strips and rejects unallowed request keys on all write endpoints.
6. **Avatar Validation**: Uploads undergo magic-byte signature validation to prevent malicious file uploads.

---

## 15. Documentation Index

For in-depth architectural specifications and diagrams, refer to the documents in the `/docs` folder:

- 📐 **[System Architecture & Technical Design](docs/ARCHITECTURE.md)**: Architectural layers, component interactions, and design trade-offs.
- 🗄️ **[Database Design & Schema Specification](docs/database-design.md)**: Detailed Mongoose models, relations, and indexing strategy.
- 📡 **[REST API Specification](docs/api-specification.md)**: Exhaustive request and response payloads for all endpoints.
- 🔐 **[Authentication & RBAC Specification](docs/authentication-and-rbac.md)**: Security flow diagrams, JWT strategies, and authorization rules.
- 🤖 **[AI Management Assistant Specification](docs/ai-assistant.md)**: Gemini prompt engineering, context aggregation, and zero-trust data privacy.
- 💻 **[Frontend Architecture Specification](docs/frontend-architecture.md)**: Component tree, Context state design, and styling guidelines.
- 📑 **[Technical Presentation & Slide Deck](docs/PRESENTATION.md)**: Project presentation guide and live demonstration script.

---

*Developed for the Sisenco Digital Technical Assignment.*
