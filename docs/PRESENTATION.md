# TeamPulse — Technical Presentation & Slide Deck

This document contains the slide-by-slide technical presentation content for the **TeamPulse — Weekly Report Generator & Team Performance Dashboard** built for the Sisenco Digital technical assignment.

---

## Slide 1: Title & Project Overview
- **Header**: TeamPulse — Weekly Report Generator & Team Performance Dashboard
- **Subtitle**: Enterprise MERN Application with State-Machine Workflows, Versioned Auditing & Dual-Role RBAC
- **Presenter**: Full-Stack Engineering Candidate
- **Organization**: Sisenco Digital Technical Assignment
- **Key Facts**: Production-ready React 18 frontend + Node.js/Express backend + MongoDB with 90/90 automated test coverage.
- **Recommended Visual**: Application hero mockup featuring the Executive Dashboard and Weekly Report Generator.

---

## Slide 2: Problem Statement & Objectives
- **Header**: The Team Reporting Challenge
- **Key Pain Points**:
  - Unstructured, scattered weekly reporting across chat/email channels.
  - Lack of version control when reports are revised or resubmitted.
  - Review bottleneck without centralized management queues.
  - Zero executive visibility into team velocity, blockers, and project hours.
- **Project Objectives**:
  - Provide structured, validated weekly reporting for team members.
  - Implement a formal manager evaluation and revision lifecycle.
  - Capture immutable point-in-time version snapshots for compliance.
  - Provide high-level analytics on velocity, status distribution, and member output.
- **Recommended Visual**: Before (scattered emails) vs. After (TeamPulse unified workflow) comparison.

---

## Slide 3: Solution Architecture
- **Header**: 3-Tier Layered Architecture
- **Core Architecture Components**:
  - **Client Tier**: React 18 SPA (Vite, Tailwind CSS, React Hook Form, Recharts, Lucide Icons).
  - **API Tier**: Node.js & Express REST API with strict Controller $\rightarrow$ Service $\rightarrow$ Model separation.
  - **Data Tier**: MongoDB with Mongoose ODM (Indexes, unique constraints, and schema validation).
- **Architectural Principles**:
  - Deterministic `ApiResponse` and `ApiError` standard formats.
  - Server-enforced validation via Zod schemas.
  - Modular domain separation (`auth`, `projects`, `reports`, `reviews`, `users`, `dashboard`).
- **Recommended Visual**: 3-tier architecture diagram mapping React $\rightarrow$ Express $\rightarrow$ MongoDB.

---

## Slide 4: Dual-Role Access Control (RBAC)
- **Header**: Strict Dual-Role Permission Matrix
- **Key Points**:
  - Strictly two system roles: `TEAM_MEMBER` and `MANAGER_ADMIN`.
  - Zero arbitrary admin elevation; `ADMIN` and standalone `MANAGER` roles are explicitly rejected.
  - **`TEAM_MEMBER`**:
    - Creates, edits, and submits own weekly reports.
    - Views assigned active projects.
    - Blocked from dashboard, reviews, and administration.
  - **`MANAGER_ADMIN`**:
    - Evaluates review inbox, approves reports, and requests revisions.
    - Manages projects, category classifications, and member allocations.
    - Manages user directory with self-deactivation safeguards.
    - Blocked from directly editing report content (must review).
- **Recommended Visual**: Permission matrix side-by-side comparison table.

---

## Slide 5: Database & ER Modeling
- **Header**: Data Modeling & Entity Relationships
- **Core Collections**:
  - **`User`**: Identity, hashed credentials, role enum, and active status.
  - **`Project`**: Organization projects with soft-archiving and member allocations.
  - **`Report`**: Transactional weekly status reports embedding tasks, blockers, achievements, and hours.
  - **`ReportVersion`**: Immutable historical point-in-time snapshots created at submission.
  - **`ReviewHistory`**: Chronological audit trail of manager review events and comments.
- **Design Rationale**:
  - Document references (`ObjectId`) for entity relationships.
  - Embedded sub-schemas for report sub-items to optimize read/write locality.
  - Strategic compounding indexes on `{ userId: 1, weekStart: -1 }` and `{ status: 1 }`.
- **Recommended Visual**: Mermaid Entity Relationship Diagram (ERD).

---

## Slide 6: Report State Machine Lifecycle
- **Header**: Deterministic Report Workflow
- **Lifecycle States**:
  - `DRAFT`: Report in progress by team member (editable, deletable).
  - `SUBMITTED`: Report locked and submitted to manager review inbox (v1 snapshot generated).
  - `NEEDS_CORRECTION`: Returned by manager with mandatory revision feedback (editable by author).
  - `APPROVED`: Finalized and locked by management (terminal state, immutable).
- **Enforcement Rules**:
  - Invalid transitions (`DRAFT` $\rightarrow$ `APPROVED`, `APPROVED` $\rightarrow$ `DRAFT`) are strictly blocked by schema and service guards.
- **Recommended Visual**: State diagram showing the complete transition cycle.

---

## Slide 7: Immutable Version History & Audit Trail
- **Header**: Point-in-Time Snapshot Versioning
- **How It Works**:
  - Every submission triggers creation of a distinct `ReportVersion` record containing a deep snapshot of report content.
  - Resubmission increments version (`v1` $\rightarrow$ `v2`) without mutating previous snapshots.
  - Integrated modal viewer enables side-by-side historical inspection.
- **Review Audit Logging**:
  - Every review action (Submission, Requested Changes, Approval) logs timestamp, reviewer ID, action, and comment in `ReviewHistory`.
- **Recommended Visual**: Screenshot of the Version Snapshot Inspector and Review Timeline.

---

## Slide 8: Manager Review & Inbox Workflow
- **Header**: Streamlined Review Interface
- **Manager Capabilities**:
  - **Pending Review Inbox**: Filterable queue of all submitted reports requiring action.
  - **Read-Only Inspection**: Clean, structured review of tasks, spent hours, deliverable links, and blockers.
  - **One-Click Approval**: Modal confirmation finalizing the report.
  - **Correction Request**: Modal with mandatory feedback validation requiring detailed revision instructions.
- **Recommended Visual**: Screenshot of the Review Inbox and the Review Detail Action Modal.

---

## Slide 9: Executive Analytics & Management
- **Header**: Real-Time Team Dashboard & Management
- **Dashboard Features**:
  - High-level KPI strip: Total Reports, Pending Review, Approved, Needs Correction, Active Projects, Active Members.
  - **Recharts Weekly Submission Velocity**: Stacked bar chart tracking report volume and status breakdown over the past 8 weeks.
  - **Team Performance Directory**: Individual submission counts, approval ratios, and last active dates.
- **Project & Team Administration**:
  - Create/edit projects with category grouping.
  - Assign team members via multi-select dialog.
  - Deactivate/reactivate accounts with self-deactivation protection.
- **Recommended Visual**: Manager Dashboard screenshot featuring KPI cards and Recharts bar graph.

---

## Slide 10: Security & Compliance
- **Header**: Enterprise Security Architecture
- **Security Implementations**:
  - **Zero JavaScript Token Storage**: JWT authentication transmitted exclusively via secure HTTP-only cookies (`auth_token`). Zero `localStorage`/`sessionStorage` token footprint (XSS mitigation).
  - **Password Security**: Passwords hashed with bcrypt (10 rounds) and excluded from queries by default (`select: false`).
  - **Anti-IDOR Ownership Isolation**: Server-enforced query filtering preventing users from accessing or modifying other members' reports.
  - **Input Sanitization**: Zod validation schemas strictly enforce valid ranges, types, and string bounds.
  - **Self-Lockout Safeguards**: Backend and UI prevent managers from deactivating their own accounts.
- **Recommended Visual**: Security architecture shield diagram highlighting cookie-based auth and RBAC guards.

---

## Slide 11: Testing & Quality Verification
- **Header**: Comprehensive Quality Assurance
- **Automated Test Results**:
  - **90 / 90 Integration Tests Passing** across 6 test suites (`Jest` + `Supertest` in memory/DB).
  - Test suites cover: Authentication & Cookie sessions, RBAC guards, Project lifecycle, Report state machine, Version snapshots, Review actions, User directory, and Dashboard aggregations.
- **Production Build Verification**:
  - Clean `vite build` compilation with zero syntax errors, type conflicts, or broken module imports.
- **Recommended Visual**: Terminal screenshot showing `111 passed, 111 total` test execution across 8 test suites.

---

## Slide 12: AI-Powered Management Assistant (Google Gemini)
- **Header**: Intelligent Team Oversight & Conversational Analytics
- **Key Capabilities**:
  - **Conversational Q&A**: Managers can ask natural-language questions about team throughput, blockers, project progress, and workload distribution.
  - **One-Click Weekly Summaries**: Instant generation of executive reports synthesizing completed tasks, critical issues, and project health.
  - **Lightweight Context Retrieval**: Direct MongoDB aggregation without complex external vector stores.
  - **Strict Anti-Hallucination Guardrails**: Low-temperature sampling (0.2) and prompt boundaries ensuring answers are strictly derived from verified report records.
  - **Zero-Trust Privacy**: Zero exposure of user passwords, tokens, or hashes to the LLM; server-side API key isolation.
- **Architecture Flow**:
  ```
  MANAGER_ADMIN ➔ AIChatWidget ➔ POST /api/ai/chat ➔ AIService (Context Retrieval) ➔ Gemini API (1.5 Flash) ➔ Structured Markdown Insights
  ```

---

## Slide 13: Conclusion & Demonstration
- **Header**: Summary & Live System Walkthrough
- **Key Achievements**:
  - Complete end-to-end full-stack reporting system built according to all Sisenco Digital specifications.
  - Robust state machine, immutable auditing, real-time executive visibility, and intelligent AI assistant.
  - Production-grade security, comprehensive test suite (111/111 passing tests), and clean documentation.
- **Live Demo Flow**:
  - Member submits report $\rightarrow$ Manager requests changes $\rightarrow$ Member resubmits $\rightarrow$ Manager approves $\rightarrow$ Dashboard analytics update $\rightarrow$ Manager queries Gemini AI Assistant for team summary.
- **Q&A**: Open for technical questions and live code inspection.

