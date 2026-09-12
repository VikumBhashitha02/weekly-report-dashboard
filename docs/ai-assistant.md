# TeamPulse AI Management Assistant Specification & Privacy Architecture

## 1. Feature Overview
The **TeamPulse AI Management Assistant** is an intelligent conversational agent integrated into TeamPulse that empowers authorized managers (`MANAGER_ADMIN`) to perform conversational Q&A, extract weekly summaries, identify recurring blockers, and analyze team workload distributions using Google's official **Gemini API** (`gemini-1.5-flash`).

---

## 2. LLM Provider & Model Selection
- **Provider**: Google Gemini API
- **Model**: `gemini-1.5-flash`
- **Rationale**:
  - Sub-second latency suitable for interactive in-app conversational assistance.
  - Large context window allowing rich weekly report aggregation without complicated chunking.
  - Cost-effective, high quota limits, and native structured system instructions support.
  - Strong instruction adherence for zero-hallucination guardrails.

---

## 3. Architecture & Data Flow

```
+-------------------------------------------------------------+
|                      MANAGER_ADMIN                          |
+-------------------------------------------------------------+
                              |
                     (1) Query / Prompt
                              v
+-------------------------------------------------------------+
|              AIChatWidget.jsx (Frontend)                    |
|  - Floating trigger button & glassmorphic chat modal       |
|  - Strictly hidden for TEAM_MEMBER users                    |
|  - No localStorage / sessionStorage token exposure          |
+-------------------------------------------------------------+
                              |
         (2) POST /api/ai/chat (HTTP-Only Cookie)
                              v
+-------------------------------------------------------------+
|                Express API Server (Backend)                 |
|  - authenticateUser Middleware                              |
|  - authorizeRoles('MANAGER_ADMIN') Middleware               |
|  - Zod Request Validation                                   |
+-------------------------------------------------------------+
                              |
             (3) Query MongoDB Application Data
                              v
+-------------------------------------------------------------+
|                      AIService                              |
|  - Lightweight Context Retrieval                            |
|  - Sanitizes user fields (excludes passwords/tokens/hashes) |
|  - Formats tasks, hours, blockers, deliverables & projects  |
|  - Injects anti-hallucination system prompt                 |
+-------------------------------------------------------------+
                              |
             (4) Sanitized Prompt + System Context
                              v
+-------------------------------------------------------------+
|                   GeminiProvider                            |
|  - Calls Google Generative AI SDK / REST API                |
|  - Low temperature (0.2) for strict factual consistency     |
|  - Resilient error & fallback handling                      |
+-------------------------------------------------------------+
                              |
            (5) Structured Markdown Response
                              v
+-------------------------------------------------------------+
|                 Manager Receives Insights                   |
+-------------------------------------------------------------+
```

---

## 4. Lightweight Context Retrieval Strategy
Rather than maintaining an expensive and complex vector database (RAG) pipeline for small-to-medium team datasets, TeamPulse employs a **lightweight, real-time structured context retrieval strategy**:

1. **Team Directory Aggregation**: Extracts active team members and roles.
2. **Project Directory Aggregation**: Extracts active project names, categories, descriptions, and member assignments.
3. **Recent Reports Window**: Fetches weekly reports from the active reporting cycle (last 45 days), extracting:
   - Member name & project
   - Reporting week start/end dates
   - Tasks (name, planned vs. actual percentage, spent hours, deliverables)
   - Next week plans & priority
   - Blockers (title, description, key issue flag)
   - Achievements (title, key achievement flag)
   - Categorized hours breakdown
4. **Structured JSON Serialization**: Converts the reporting records into a clean, compact JSON string and injects it directly into the Gemini prompt payload.

---

## 5. System Prompt & Anti-Hallucination Guardrails
The system instruction enforces strict operational boundaries:

```text
You are the TeamPulse AI Management Assistant for authorized managers and administrators.
Your purpose is to provide clear, actionable, and strictly factual insights about team activity, project progress, weekly reports, blockers, and workload balance.

CRITICAL OPERATIONAL RULES:
1. STRICT FACTUAL ACCURACY:
   - Rely ONLY on the provided JSON context data.
   - DO NOT invent, assume, or hallucinate tasks, employees, hours, blockers, deliverables, or project activity.
   - If the available report data does not contain information to answer the question, explicitly state that the information is not available in the current records.

2. OBSERVATION VS FACT:
   - Clearly distinguish between reported facts and analytical observations.
   - When discussing workload or blockers, avoid making definitive HR or performance judgments about individuals.

3. PRIVACY & SECURITY:
   - Never output passwords, hashes, tokens, API keys, or system internals.
   - Treat all team member data with professional respect.

4. RESPONSE FORMATTING:
   - Use clean, structured Markdown formatting (bullet points, bold highlights, concise paragraphs).
```

---

## 6. Security, RBAC & Data Privacy

### Server-Side Key Isolation
- `GEMINI_API_KEY` is loaded strictly on the backend via environment variables.
- The Gemini API key is **never** sent to the client, embedded in the Vite bundle, or exposed in client-side storage.

### Role-Based Access Control (RBAC)
- Endpoint `POST /api/ai/chat` is protected by `authenticateUser` and `authorizeRoles('MANAGER_ADMIN')`.
- Any attempt by `TEAM_MEMBER` users or unauthenticated clients to access the endpoint results in immediate `403 Forbidden` / `401 Unauthorized` responses.

### Data Minimization & Privacy
- Sensitive User fields (e.g. `password`, bcrypt hashes, JWT tokens, cookies, auth metadata) are **completely excluded** from the context passed to the AI model.
- Only factual reporting attributes necessary for operational analysis (tasks, hours, blockers, achievements, projects) are supplied.

---

## 7. Failure Handling & Resilience
If the Gemini API encounters rate limits, network outages, or if the API key is not configured:
- The backend catches upstream errors and returns a graceful, human-readable response without crashing the server or leaking stack traces.
- The rest of the TeamPulse application (reports, reviews, projects, dashboards) continues functioning with zero disruption.

---

## 8. Example Questions & Quick Prompts
Managers can ask arbitrary queries or click suggested prompt chips:
1. *"What did the team work on last week?"*
2. *"What are the main blockers this week?"*
3. *"Summarize this week's team activity."*
4. *"Which projects need attention?"*
5. *"Are there any workload imbalances?"*
6. **Quick Action**: *"Generate Weekly Summary"* button generates a standardized executive briefing of team throughput and blockers.
