const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const config = require('../src/config/env');
const { User, Project, Report } = require('../src/models');
const geminiProvider = require('../src/modules/ai/gemini.provider');

// Mock gemini.provider to ensure deterministic tests without external API dependencies
jest.mock('../src/modules/ai/gemini.provider', () => ({
  isConfigured: jest.fn(() => true),
  generateAnswer: jest.fn(async ({ systemInstruction, prompt }) => {
    if (prompt.includes('REVISE_ERROR_TEST')) {
      return 'AI Assistant is temporarily unavailable. Please try again later.';
    }
    return 'Based on the TeamPulse records, Alex Johnson logged 38 hours across Project Alpha, completing all core weekly deliverables without critical blockers.';
  }),
}));

describe('Gemini AI Assistant Module Integration Tests', () => {
  let memberUser, managerUser;
  let memberToken, managerToken;
  let memberCookie, managerCookie;
  let project;

  const createAuthToken = (user) => {
    return jwt.sign({ userId: user._id, role: user.role }, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn,
    });
  };

  beforeAll(async () => {
    const testDbUri = config.mongodbUri.includes('?')
      ? config.mongodbUri.replace('?', '_test?')
      : `${config.mongodbUri}_test`;

    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(testDbUri);
    }

    await User.deleteMany({});
    await Project.deleteMany({});
    await Report.deleteMany({});

    // Create Team Member
    memberUser = await User.create({
      name: 'Taylor Member',
      email: 'taylor.ai@example.com',
      password: await bcrypt.hash('Password123!', 10),
      role: 'TEAM_MEMBER',
      isActive: true,
    });

    // Create Manager Admin
    managerUser = await User.create({
      name: 'Sam Manager',
      email: 'sam.ai@example.com',
      password: await bcrypt.hash('Password123!', 10),
      role: 'MANAGER_ADMIN',
      isActive: true,
    });

    memberToken = createAuthToken(memberUser);
    managerToken = createAuthToken(managerUser);

    memberCookie = `${config.cookieName}=${memberToken}`;
    managerCookie = `${config.cookieName}=${managerToken}`;

    // Create Project
    project = await Project.create({
      name: 'Project AI Integration',
      category: 'Engineering',
      description: 'Implementing LLM intelligence layer',
      assignedMembers: [memberUser._id],
      isActive: true,
    });

    // Create Report
    await Report.create({
      userId: memberUser._id,
      projectId: project._id,
      weekStart: new Date('2026-09-01'),
      weekEnd: new Date('2026-09-07'),
      status: 'APPROVED',
      tasks: [
        {
          taskName: 'Develop AI context pipeline',
          status: 'COMPLETED',
          plannedPercentage: 100,
          actualPercentage: 100,
          spentHours: 20,
        },
      ],
      blockers: [
        {
          title: 'API rate limits',
          description: 'Occasional latency on upstream LLM requests',
          isKeyIssue: false,
        },
      ],
      achievements: [
        {
          title: 'Complete zero-hallucination prompt architecture',
          isKeyAchievement: true,
        },
      ],
      hours: [{ taskType: 'Development', hours: 20 }],
      currentVersion: 1,
    });
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Project.deleteMany({});
    await Report.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================
  // 1. Authentication & RBAC Tests
  // ==========================================
  describe('RBAC & Access Control (POST /api/ai/chat)', () => {
    it('1. should reject unauthenticated requests with 401 Unauthorized', async () => {
      const res = await request(app)
        .post('/api/ai/chat')
        .send({ message: 'What is the team working on?' });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(geminiProvider.generateAnswer).not.toHaveBeenCalled();
    });

    it('2. should reject TEAM_MEMBER access with 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/ai/chat')
        .set('Cookie', memberCookie)
        .send({ message: 'What is the team working on?' });

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Access denied/i);
      expect(geminiProvider.generateAnswer).not.toHaveBeenCalled();
    });


    it('3. should allow MANAGER_ADMIN to query the assistant', async () => {
      const res = await request(app)
        .post('/api/ai/chat')
        .set('Cookie', managerCookie)
        .send({ message: 'What did Taylor work on last week?' });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('message');
      expect(res.body.data.message).toContain('Alex Johnson');
      expect(geminiProvider.generateAnswer).toHaveBeenCalledTimes(1);
    });
  });

  // ==========================================
  // 2. Request Validation Tests
  // ==========================================
  describe('Request Validation', () => {
    it('4. should reject missing message payload with 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/ai/chat')
        .set('Cookie', managerCookie)
        .send({});

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/message is required/i);
    });

    it('5. should reject empty or whitespace message with 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/ai/chat')
        .set('Cookie', managerCookie)
        .send({ message: '    ' });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/cannot be empty/i);
    });

    it('6. should reject oversized message (> 1500 chars) with 400 Bad Request', async () => {
      const oversizedText = 'A'.repeat(1501);
      const res = await request(app)
        .post('/api/ai/chat')
        .set('Cookie', managerCookie)
        .send({ message: oversizedText });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/cannot exceed 1500 characters/i);
    });
  });

  // ==========================================
  // 3. Data Privacy & Context Sanitization
  // ==========================================
  describe('Data Privacy & Prompt Sanitization', () => {
    it('7. should NOT include user password hashes, tokens, or raw secrets in prompt sent to Gemini', async () => {
      const res = await request(app)
        .post('/api/ai/chat')
        .set('Cookie', managerCookie)
        .send({ message: 'Analyze current team health and blockers' });

      expect(res.statusCode).toBe(200);
      expect(geminiProvider.generateAnswer).toHaveBeenCalled();

      const callArgs = geminiProvider.generateAnswer.mock.calls[0][0];
      const { prompt, systemInstruction } = callArgs;

      // Ensure system instructions exist and contain anti-hallucination rules
      expect(systemInstruction).toMatch(/TeamPulse AI Management Assistant/i);
      expect(systemInstruction).toMatch(/DO NOT invent/i);

      // Verify prompt contains project & task context
      expect(prompt).toContain('Project AI Integration');
      expect(prompt).toContain('Develop AI context pipeline');
      expect(prompt).toContain('Taylor Member');

      // CRITICAL SECURITY CHECKS: No secrets in prompt
      expect(prompt).not.toContain('Password123!');
      expect(prompt).not.toContain('$2a$10$');
      expect(prompt).not.toContain(config.jwtSecret);
      expect(prompt).not.toContain(managerToken);
      expect(prompt).not.toContain('jwt');
    });

    it('8. should handle Gemini fallback responses gracefully', async () => {
      const res = await request(app)
        .post('/api/ai/chat')
        .set('Cookie', managerCookie)
        .send({ message: 'REVISE_ERROR_TEST: Trigger simulated fallback response' });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.message).toMatch(/temporarily unavailable/i);
    });
  });
});
