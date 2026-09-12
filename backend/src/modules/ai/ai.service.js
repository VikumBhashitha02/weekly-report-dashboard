const { User, Project, Report } = require('../../models');
const geminiProvider = require('./gemini.provider');

/**
 * AI Management Assistant Service
 * Handles data context retrieval, privacy sanitization, prompt construction, and Gemini invocation.
 */
class AIService {
  /**
   * Builds sanitized application context for the AI model
   * Omits all sensitive user fields, passwords, hashes, and internal secrets.
   * @returns {Promise<string>}
   */
  async buildContext() {
    // 1. Fetch team members (read-only sanitized fields)
    const users = await User.find({}, 'name email role isActive createdAt')
      .lean()
      .exec();

    const userMap = {};
    users.forEach((u) => {
      userMap[u._id.toString()] = u.name;
    });

    const sanitizedUsers = users.map((u) => ({
      name: u.name,
      role: u.role,
      status: u.isActive ? 'Active' : 'Deactivated',
    }));

    // 2. Fetch active projects
    const projects = await Project.find({}, 'name category description assignedMembers isActive')
      .lean()
      .exec();

    const sanitizedProjects = projects.map((p) => ({
      name: p.name,
      category: p.category || 'General',
      description: p.description || 'No description',
      status: p.isActive ? 'Active' : 'Archived',
      assignedMembers: (p.assignedMembers || []).map((mId) => userMap[mId.toString()] || 'Unknown Member'),
    }));

    // 3. Fetch recent reports (last 45 days / recent submissions)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 45);

    const reports = await Report.find({ createdAt: { $gte: cutoffDate } })
      .populate('userId', 'name email role')
      .populate('projectId', 'name category')
      .sort({ weekStart: -1, createdAt: -1 })
      .limit(60)
      .lean()
      .exec();

    const sanitizedReports = reports.map((r) => {
      const totalSpentHours = (r.tasks || []).reduce((acc, t) => acc + (t.spentHours || 0), 0);
      const hoursBreakdown = (r.hours || []).map((h) => `${h.taskType}: ${h.hours}h`).join(', ');

      return {
        memberName: r.userId?.name || 'Unknown',
        projectName: r.projectId?.name || 'Unknown',
        projectCategory: r.projectId?.category || 'General',
        week: `${r.weekStart ? new Date(r.weekStart).toISOString().split('T')[0] : 'N/A'} to ${
          r.weekEnd ? new Date(r.weekEnd).toISOString().split('T')[0] : 'N/A'
        }`,
        status: r.status,
        version: r.currentVersion,
        tasks: (r.tasks || []).map((t) => ({
          name: t.taskName,
          status: t.status,
          plannedPercent: `${t.plannedPercentage}%`,
          actualPercent: `${t.actualPercentage}%`,
          spentHours: t.spentHours,
        })),
        nextWeekTasks: (r.nextWeekTasks || []).map((nw) => ({
          name: nw.taskName,
          priority: nw.priority,
        })),
        blockers: (r.blockers || []).map((b) => ({
          title: b.title,
          description: b.description,
          isKeyIssue: b.isKeyIssue,
        })),
        achievements: (r.achievements || []).map((a) => ({
          title: a.title,
          description: a.description,
          isKeyAchievement: a.isKeyAchievement,
        })),
        totalHours: totalSpentHours,
        hoursByType: hoursBreakdown || 'None specified',
        notes: r.notes || '',
      };
    });

    return JSON.stringify(
      {
        activeTeamMembers: sanitizedUsers,
        projects: sanitizedProjects,
        recentWeeklyReports: sanitizedReports,
      },
      null,
      2
    );
  }

  /**
   * Builds the strict system instructions for the TeamPulse Management Assistant
   * @returns {string}
   */
  getSystemInstruction() {
    return `You are the TeamPulse AI Management Assistant for authorized managers and administrators.
Your purpose is to provide clear, actionable, and strictly factual insights about team activity, project progress, weekly reports, blockers, and workload balance.

CRITICAL OPERATIONAL RULES:
1. STRICT FACTUAL ACCURACY:
   - Rely ONLY on the provided JSON context data.
   - DO NOT invent, assume, or hallucinate tasks, employees, hours, blockers, deliverables, or project activity.
   - If the available report data does not contain information to answer the question, explicitly state that the information is not available in the current records.

2. OBSERVATION VS FACT:
   - Clearly distinguish between reported facts (e.g. "Alex logged 38 hours on Project Phoenix") and analytical observations (e.g. "This reported workload is higher than average for this week").
   - When discussing workload or blockers, avoid making definitive HR or performance judgments about individuals.

3. PRIVACY & SECURITY:
   - Never output passwords, hashes, tokens, API keys, or system internals.
   - Treat all team member data with professional respect.

4. RESPONSE FORMATTING:
   - Use clean, structured Markdown formatting (bullet points, bold highlights, concise paragraphs).
   - When providing a summary, organize your response logically (e.g., Executive Summary, Key Completed Work, Active Blockers, Workload Observations, Recommended Action Items).
   - Keep answers concise, direct, and professional.`;
  }

  /**
   * Process a manager's question using lightweight context retrieval and Gemini
   * @param {object} params
   * @param {string} params.message - The manager's input query
   * @param {object} params.manager - Authenticated manager user object
   * @returns {Promise<{ message: string, timestamp: string }>}
   */
  async askAssistant({ message, manager }) {
    const contextData = await this.buildContext();
    const systemInstruction = this.getSystemInstruction();

    const todayDateStr = new Date().toISOString().split('T')[0];

    const prompt = `TODAY'S DATE: ${todayDateStr}
REQUESTING MANAGER: ${manager?.name || 'Manager'} (${manager?.email || ''})

CURRENT APPLICATION DATA CONTEXT:
\`\`\`json
${contextData}
\`\`\`

MANAGER QUESTION / PROMPT:
"${message}"

Please analyze the provided TeamPulse data context and provide a structured, helpful, and strictly factual response.`;

    const answer = await geminiProvider.generateAnswer({
      systemInstruction,
      prompt,
    });

    return {
      message: answer,
      timestamp: new Date().toISOString(),
    };
  }
}

module.exports = new AIService();
