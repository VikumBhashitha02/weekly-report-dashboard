# Complete API Endpoint Specification

This document provides the reference documentation for all REST API endpoints available in the **Weekly Report Generator & Team Dashboard** backend.

---

## 1. Authentication Endpoints (`/api/auth`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register new user (strictly assigned `TEAM_MEMBER` role). Sets HTTP-only `auth_token` cookie. |
| `POST` | `/api/auth/login` | Public | Authenticate user with email & password. Sets HTTP-only `auth_token` cookie. |
| `POST` | `/api/auth/logout` | Public | Destroy session and clear `auth_token` cookie. |
| `GET` | `/api/auth/me` | Authenticated | Retrieve current authenticated user profile without password. |

---

## 2. Projects Endpoints (`/api/projects`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/projects` | Authenticated | List projects (`TEAM_MEMBER` sees assigned projects; `MANAGER_ADMIN` sees all). |
| `GET` | `/api/projects/categories` | Authenticated | List distinct project categories. |
| `GET` | `/api/projects/:id` | Authenticated | Get project details (`TEAM_MEMBER` must be assigned). |
| `POST` | `/api/projects` | `MANAGER_ADMIN` | Create a new project (`name`, `description`, `category`). |
| `PUT` | `/api/projects/:id` | `MANAGER_ADMIN` | Update project details. |
| `PATCH` | `/api/projects/:id/members`| `MANAGER_ADMIN` | Replace assigned team members on a project (`memberIds`). |
| `DELETE` | `/api/projects/:id` | `MANAGER_ADMIN` | Permanently delete a project. |

---

## 3. Reports Endpoints (`/api/reports`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/reports` | Authenticated | List reports (`TEAM_MEMBER` sees own; `MANAGER_ADMIN` can filter by `userId`, `projectId`, `status`, dates). |
| `GET` | `/api/reports/:id` | Authenticated | Get single report (`TEAM_MEMBER` sees own only). |
| `GET` | `/api/reports/:id/versions`| Authenticated | Get immutable version history snapshots of a report. |
| `POST` | `/api/reports` | `TEAM_MEMBER` | Create a new weekly report draft (`projectId`, `weekStart`, `weekEnd`, `tasks`, `blockers`, etc.). |
| `PUT` | `/api/reports/:id` | `TEAM_MEMBER` | Edit draft or needs-correction report. |
| `PATCH` | `/api/reports/:id/submit` | `TEAM_MEMBER` | Submit report for review. Increments version, captures snapshot in `ReportVersion`, and logs to `ReviewHistory`. |
| `DELETE` | `/api/reports/:id` | `TEAM_MEMBER` | Delete own report (allowed **only** in `DRAFT` status). |

---

## 4. Review Workflow Endpoints (`/api/reviews`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/reviews/pending` | `MANAGER_ADMIN` | Get all reports with `status: 'SUBMITTED'` waiting for manager review (review queue inbox). |
| `GET` | `/api/reviews/:reportId/history` | `MANAGER_ADMIN` | Retrieve full chronological audit trail and feedback history for a report. |
| `PATCH` | `/api/reviews/:reportId/approve` | `MANAGER_ADMIN` | Approve submitted report (`comment` optional). Updates status to `APPROVED`. |
| `PATCH` | `/api/reviews/:reportId/request-correction` | `MANAGER_ADMIN` | Request changes on submitted report (`comment` required). Updates status to `NEEDS_CORRECTION`. |

---

## 5. Users Management Endpoints (`/api/users`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/users` | Authenticated | List users (`TEAM_MEMBER` sees self; `MANAGER_ADMIN` sees all with filters). |
| `GET` | `/api/users/:id` | Authenticated | Get user profile by ID (`TEAM_MEMBER` sees self only). |
| `PUT` | `/api/users/:id` | Authenticated | Update user profile (`TEAM_MEMBER` can update `name`/`avatar`; `MANAGER_ADMIN` can also update `role`). |
| `PATCH` | `/api/users/:id/deactivate` | `MANAGER_ADMIN` | Deactivate account (prevents self-deactivation). |
| `PATCH` | `/api/users/:id/reactivate` | `MANAGER_ADMIN` | Reactivate a deactivated user account. |

---

## 6. Dashboard Analytics Endpoints (`/api/dashboard`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/dashboard/stats` | `MANAGER_ADMIN` | High-level metrics: user counts, project counts, report status breakdown, and recent submissions. |
| `GET` | `/api/dashboard/trend` | `MANAGER_ADMIN` | Weekly report submission volume and approval breakdown (`?weeks=8`). |
| `GET` | `/api/dashboard/members` | `MANAGER_ADMIN` | Per-member submission summary table (total, approved, submitted, draft, needs correction). |
