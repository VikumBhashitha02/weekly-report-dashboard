const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const config = require('../src/config/env');
const { User, Project, Report } = require('../src/models');

describe('Users & Dashboard Integration Tests', () => {
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
      name: 'Dave Member',
      email: 'dave@example.com',
      password: await bcrypt.hash('Password123!', 10),
      role: 'TEAM_MEMBER',
      isActive: true,
    });

    // Create Manager Admin
    managerUser = await User.create({
      name: 'Eve Manager',
      email: 'eve@example.com',
      password: await bcrypt.hash('Password123!', 10),
      role: 'MANAGER_ADMIN',
      isActive: true,
    });

    memberToken = createAuthToken(memberUser);
    managerToken = createAuthToken(managerUser);

    memberCookie = `${config.cookieName}=${memberToken}`;
    managerCookie = `${config.cookieName}=${managerToken}`;

    // Create a project and report for dashboard data verification
    project = await Project.create({
      name: 'Cloud Infrastructure',
      category: 'DevOps',
      assignedMembers: [memberUser._id],
      isActive: true,
    });

    await Report.create({
      userId: memberUser._id,
      projectId: project._id,
      weekStart: new Date(),
      weekEnd: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
      status: 'APPROVED',
      tasks: [{ taskName: 'Setup CI/CD pipeline', status: 'COMPLETED' }],
      currentVersion: 1,
      submittedAt: new Date(),
      approvedAt: new Date(),
    });
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Project.deleteMany({});
    await Report.deleteMany({});
    await mongoose.connection.close();
  });

  // ==========================================
  // 1. Users API Tests
  // ==========================================
  describe('Users Management API', () => {
    it('1. should allow TEAM_MEMBER to retrieve only themselves from GET /api/users', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Cookie', memberCookie);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].email).toBe('dave@example.com');
    });

    it('2. should allow MANAGER_ADMIN to retrieve all users from GET /api/users', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Cookie', managerCookie);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    });

    it('3. should allow TEAM_MEMBER to update their own name/avatar', async () => {
      const res = await request(app)
        .put(`/api/users/${memberUser._id}`)
        .set('Cookie', memberCookie)
        .send({ name: 'Dave Updated' });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Dave Updated');
    });

    it('4. should prevent TEAM_MEMBER from escalating role or changing password via PUT /api/users/:id', async () => {
      const res = await request(app)
        .put(`/api/users/${memberUser._id}`)
        .set('Cookie', memberCookie)
        .send({ role: 'MANAGER_ADMIN', password: 'NewHackedPassword!' });

      expect(res.statusCode).toBe(200);
      // Verify role remains TEAM_MEMBER
      const dbUser = await User.findById(memberUser._id);
      expect(dbUser.role).toBe('TEAM_MEMBER');
    });

    it('5. should reject MANAGER_ADMIN deactivating their own account with 400 Bad Request', async () => {
      const res = await request(app)
        .patch(`/api/users/${managerUser._id}/deactivate`)
        .set('Cookie', managerCookie);

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/cannot deactivate your own account/i);
    });

    it('6. should allow MANAGER_ADMIN to deactivate a team member account', async () => {
      const res = await request(app)
        .patch(`/api/users/${memberUser._id}/deactivate`)
        .set('Cookie', managerCookie);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.isActive).toBe(false);

      const dbUser = await User.findById(memberUser._id);
      expect(dbUser.isActive).toBe(false);
    });

    it('7. should allow MANAGER_ADMIN to reactivate a team member account', async () => {
      const res = await request(app)
        .patch(`/api/users/${memberUser._id}/reactivate`)
        .set('Cookie', managerCookie);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.isActive).toBe(true);

      const dbUser = await User.findById(memberUser._id);
      expect(dbUser.isActive).toBe(true);
    });
  });

  // ==========================================
  // 2. Dashboard API Tests
  // ==========================================
  describe('Dashboard Analytics API', () => {
    it('8. should reject TEAM_MEMBER from accessing GET /api/dashboard/stats with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/dashboard/stats')
        .set('Cookie', memberCookie);

      expect(res.statusCode).toBe(403);
    });

    it('9. should return accurate summary statistics on GET /api/dashboard/stats for MANAGER_ADMIN', async () => {
      const res = await request(app)
        .get('/api/dashboard/stats')
        .set('Cookie', managerCookie);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('users');
      expect(res.body.data).toHaveProperty('projects');
      expect(res.body.data).toHaveProperty('reports');
      expect(res.body.data.users.total).toBeGreaterThanOrEqual(2);
      expect(res.body.data.reports.byStatus.APPROVED).toBeGreaterThanOrEqual(1);
    });

    it('10. should return weekly trend data on GET /api/dashboard/trend for MANAGER_ADMIN', async () => {
      const res = await request(app)
        .get('/api/dashboard/trend?weeks=4')
        .set('Cookie', managerCookie);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0]).toHaveProperty('label');
      expect(res.body.data[0]).toHaveProperty('approved');
    });

    it('11. should return per-member report submission summary on GET /api/dashboard/members for MANAGER_ADMIN', async () => {
      const res = await request(app)
        .get('/api/dashboard/members')
        .set('Cookie', managerCookie);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0]).toHaveProperty('name');
      expect(res.body.data[0]).toHaveProperty('totalReports');
      expect(res.body.data[0]).toHaveProperty('approvedReports');
    });
  });
});
