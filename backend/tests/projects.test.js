const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const config = require('../src/config/env');
const { User, Project } = require('../src/models');

describe('Projects Module Integration Tests', () => {
  let memberToken;
  let managerToken;
  let memberCookie;
  let managerCookie;
  let memberUser;
  let managerUser;
  let testProject;

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

    // Create a Team Member
    memberUser = await User.create({
      name: 'Project Test Member',
      email: 'member_proj@example.com',
      password: await bcrypt.hash('Password123!', 10),
      role: 'TEAM_MEMBER',
      isActive: true,
    });

    // Create a Manager Admin
    managerUser = await User.create({
      name: 'Project Test Manager',
      email: 'manager_proj@example.com',
      password: await bcrypt.hash('Password123!', 10),
      role: 'MANAGER_ADMIN',
      isActive: true,
    });

    memberToken = createAuthToken(memberUser);
    managerToken = createAuthToken(managerUser);

    memberCookie = `${config.cookieName}=${memberToken}`;
    managerCookie = `${config.cookieName}=${managerToken}`;
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Project.deleteMany({});
    await mongoose.connection.close();
  });

  // ==========================================
  // 1. Project Creation
  // ==========================================
  describe('POST /api/projects', () => {
    it('1. should reject project creation by TEAM_MEMBER with 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Cookie', memberCookie)
        .send({
          name: 'Unauthorized Project',
          description: 'Should fail',
          category: 'Engineering',
        });

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('2. should allow MANAGER_ADMIN to create a new project', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Cookie', managerCookie)
        .send({
          name: 'Alpha Project',
          description: 'Flagship engineering project',
          category: 'Engineering',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Alpha Project');
      expect(res.body.data.category).toBe('Engineering');
      expect(res.body.data.isActive).toBe(true);

      testProject = res.body.data;
    });

    it('3. should reject duplicate project name with 409 Conflict', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Cookie', managerCookie)
        .send({
          name: 'Alpha Project',
          description: 'Duplicate',
          category: 'Design',
        });

      expect(res.statusCode).toBe(409);
      expect(res.body.success).toBe(false);
    });
  });

  // ==========================================
  // 2. Member Assignment & Access Control
  // ==========================================
  describe('PATCH /api/projects/:id/members', () => {
    it('4. should reject member assignment by TEAM_MEMBER with 403 Forbidden', async () => {
      const res = await request(app)
        .patch(`/api/projects/${testProject._id}/members`)
        .set('Cookie', memberCookie)
        .send({
          memberIds: [memberUser._id.toString()],
        });

      expect(res.statusCode).toBe(403);
    });

    it('5. should allow MANAGER_ADMIN to assign a team member to a project', async () => {
      const res = await request(app)
        .patch(`/api/projects/${testProject._id}/members`)
        .set('Cookie', managerCookie)
        .send({
          memberIds: [memberUser._id.toString()],
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.assignedMembers).toHaveLength(1);
      expect(res.body.data.assignedMembers[0]._id.toString()).toBe(memberUser._id.toString());
    });

    it('6. should reject invalid memberIds with 400 Bad Request', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .patch(`/api/projects/${testProject._id}/members`)
        .set('Cookie', managerCookie)
        .send({
          memberIds: [fakeId],
        });

      expect(res.statusCode).toBe(400);
    });
  });

  // ==========================================
  // 3. Project Retrieval & Role Filtering
  // ==========================================
  describe('GET /api/projects', () => {
    it('7. should allow assigned TEAM_MEMBER to see the project', async () => {
      const res = await request(app)
        .get('/api/projects')
        .set('Cookie', memberCookie);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].name).toBe('Alpha Project');
    });

    it('8. should allow MANAGER_ADMIN to see all projects', async () => {
      const res = await request(app)
        .get('/api/projects')
        .set('Cookie', managerCookie);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('9. should return distinct project categories on GET /api/projects/categories', async () => {
      const res = await request(app)
        .get('/api/projects/categories')
        .set('Cookie', memberCookie);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data).toContain('Engineering');
    });
  });

  // ==========================================
  // 4. Project Update & Deletion
  // ==========================================
  describe('PUT & DELETE /api/projects/:id', () => {
    it('10. should allow MANAGER_ADMIN to update project details', async () => {
      const res = await request(app)
        .put(`/api/projects/${testProject._id}`)
        .set('Cookie', managerCookie)
        .send({
          description: 'Updated engineering project description',
          category: 'Core Engineering',
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.description).toBe('Updated engineering project description');
      expect(res.body.data.category).toBe('Core Engineering');
    });

    it('11. should reject update by TEAM_MEMBER with 403 Forbidden', async () => {
      const res = await request(app)
        .put(`/api/projects/${testProject._id}`)
        .set('Cookie', memberCookie)
        .send({ description: 'Hacked description' });

      expect(res.statusCode).toBe(403);
    });

    it('12. should reject delete by TEAM_MEMBER with 403 Forbidden', async () => {
      const res = await request(app)
        .delete(`/api/projects/${testProject._id}`)
        .set('Cookie', memberCookie);

      expect(res.statusCode).toBe(403);
    });

    it('13. should allow MANAGER_ADMIN to delete a project', async () => {
      const res = await request(app)
        .delete(`/api/projects/${testProject._id}`)
        .set('Cookie', managerCookie);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

      const findDeleted = await Project.findById(testProject._id);
      expect(findDeleted).toBeNull();
    });
  });
});
