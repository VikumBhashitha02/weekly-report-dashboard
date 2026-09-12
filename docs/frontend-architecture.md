# Frontend Architecture & Role-Based Navigation Specification

This document details the frontend architecture, routing strategy, and role-based access control implemented for the **Weekly Report Generator & Team Dashboard** (Sisenco Digital Technical Assignment).

---

## 1. High-Level Architecture Overview

The frontend is built using **React 18 + Vite**, structured with clean separation across services, context, layouts, components, and pages.

```text
React (Vite)
 ├── context/
 │    ├── AuthContext.jsx      (Session state, login/register/logout actions)
 │    └── ToastContext.jsx     (Floating notification system)
 ├── services/
 │    ├── api.js              (Axios client: withCredentials: true, base URL)
 │    └── authService.js      (Auth API wrappers: register, login, logout, getMe)
 ├── layouts/
 │    ├── AuthLayout.jsx      (Centered branding shell for /login, /register)
 │    └── MainLayout.jsx      (App shell: Sidebar, Navbar, and Content Viewport)
 ├── components/
 │    ├── common/
 │    │    ├── ProtectedRoute.jsx (Session verification & role authorization guard)
 │    │    ├── Sidebar.jsx        (Role-aware navigation menu & user profile)
 │    │    └── Navbar.jsx         (Top header with breadcrumbs & actions)
 │    └── ui/
 │         ├── PageLoader.jsx     (Fullscreen/section spinner)
 │         ├── ButtonSpinner.jsx  (Inline button spinner)
 │         ├── ErrorMessage.jsx   (Form & API alert banner)
 │         └── EmptyState.jsx     (Placeholder empty state)
 └── routes/
      └── AppRoutes.jsx       (Centralized React Router v6 route definitions)
```

---

## 2. Authentication & Session Strategy

- **HTTP-Only Cookies**: JWT tokens are managed entirely through HTTP-only cookies (`auth_token`) set and cleared by the backend.
- **Zero Token Leakage**: The frontend **never** accesses `document.cookie`, `localStorage`, or `sessionStorage` for tokens.
- **Session Restoration**: On initial load, `AuthProvider` queries `GET /api/auth/me`. If the cookie is valid, the user's profile is loaded into context; if `401 Unauthorized`, the user is cleanly marked unauthenticated without blocking the UI.
- **Role Detection**: Exposes `isManagerAdmin` (`user.role === 'MANAGER_ADMIN'`) and `isTeamMember` (`user.role === 'TEAM_MEMBER'`).

---

## 3. Route Matrix & RBAC Guards

All routes are guarded by `ProtectedRoute.jsx`:

| Path | Layout | Access / Allowed Roles | Destination Description |
| :--- | :--- | :--- | :--- |
| `/` | N/A | Dynamic Redirect | If unauthenticated → `/login`<br>If `TEAM_MEMBER` → `/reports`<br>If `MANAGER_ADMIN` → `/dashboard` |
| `/login` | `AuthLayout` | Public | Sign in form (redirects away if already logged in) |
| `/register` | `AuthLayout` | Public | Sign up form (automatically coerces to `TEAM_MEMBER`) |
| `/unauthorized` | Standalone | Public / Guarded | 403 Access Denied page with back/home buttons |
| `/status` | Standalone | Public | Diagnostics & health-check verification |
| `/reports` | `MainLayout` | `TEAM_MEMBER`, `MANAGER_ADMIN` | Weekly reports list |
| `/reports/new` | `MainLayout` | `TEAM_MEMBER` | Create new weekly report draft |
| `/reports/:id` | `MainLayout` | `TEAM_MEMBER`, `MANAGER_ADMIN` | Report details, audit trail & versions |
| `/dashboard` | `MainLayout` | `MANAGER_ADMIN` only | Team overview analytics & trends |
| `/reviews` | `MainLayout` | `MANAGER_ADMIN` only | Submitted reports pending review inbox |
| `/reviews/:id` | `MainLayout` | `MANAGER_ADMIN` only | Review evaluation interface |
| `/projects` | `MainLayout` | `MANAGER_ADMIN` only | Project management & member assignments |
| `/team` | `MainLayout` | `MANAGER_ADMIN` only | User directory & account deactivation |
| `*` | Standalone | Public | 404 Page Not Found |

---

## 4. Role-Aware Navigation Configuration

The [`Sidebar.jsx`](file:///d:/Sisenco%20Assignment/frontend/src/components/common/Sidebar.jsx) dynamically renders navigation options based on the authenticated user's role:

- **`TEAM_MEMBER` View**:
  - 📄 *My Reports* (`/reports`)
  - ➕ *New Report* (`/reports/new`)
- **`MANAGER_ADMIN` View**:
  - 📊 *Dashboard* (`/dashboard`)
  - 📥 *Review Inbox* (`/reviews`)
  - 📁 *Projects* (`/projects`)
  - 👥 *Team Members* (`/team`)
