const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const config = require('../src/config/env');
const { User, Project, Report, ReportVersion, ReviewHistory } = require('../src/models');

describe('Reports & Review Workflow Integration Tests', () => {
  let member1, member2, manager;
  let member1Token, member2Token, managerToken;
  let member1Cookie, member2Cookie, managerCookie;
  let project;
  let createdReportId;

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
    await ReportVersion.deleteMany({});
    await ReviewHistory.deleteMany({});

    // Create 2 Team Members
    member1 = await User.create({
      name: 'Alice Member',
      email: 'alice@example.com',
      password: await bcrypt.hash('Password123!', 10),
      role: 'TEAM_MEMBER',
      isActive: true,
    });

    member2 = await User.create({
      name: 'Bob Member',
      email: 'bob@example.com',
      password: await bcrypt.hash('Password123!', 10),
      role: 'TEAM_MEMBER',
      isActive: true,
    });

    // Create 1 Manager Admin
    manager = await User.create({
      name: 'Carol Manager',
      email: 'carol@example.com',
      password: await bcrypt.hash('Password123!', 10),
      role: 'MANAGER_ADMIN',
      isActive: true,
    });

    member1Token = createAuthToken(member1);
    member2Token = createAuthToken(member2);
    managerToken = createAuthToken(manager);

    member1Cookie = `${config.cookieName}=${member1Token}`;
    member2Cookie = `${config.cookieName}=${member2Token}`;
    managerCookie = `${config.cookieName}=${managerToken}`;

    // Create test project with Alice assigned
    project = await Project.create({
      name: 'E-Commerce Platform',
      description: 'Main product backlog',
      category: 'Web Development',
      assignedMembers: [member1._id],
      isActive: true,
    });
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Project.deleteMany({});
    await Report.deleteMany({});
    await ReportVersion.deleteMany({});
    await ReviewHistory.deleteMany({});
    await mongoose.connection.close();
  });

  // ==========================================
  // 1. Report Draft Creation & Ownership
  // ==========================================
  describe('POST /api/reports', () => {
    it('1. should allow TEAM_MEMBER to create a new draft report', async () => {
      const res = await request(app)
        .post('/api/reports')
        .set('Cookie', member1Cookie)
        .send({
          projectId: project._id.toString(),
          weekStart: '2026-09-07T00:00:00.000Z',
          weekEnd: '2026-09-13T23:59:59.000Z',
          tasks: [
            {
              taskName: 'Implement Payment Gateway',
              priority: 'HIGH',
              plannedPercentage: 100,
              actualPercentage: 80,
              status: 'IN_PROGRESS',
              plannedHours: 20,
              spentHours: 18,
              deliverable: 'Stripe integration PR',
            },
          ],
          blockers: [
            {
              title: 'API Rate Limiting',
              description: 'Waiting for Stripe sandbox tier increase',
              isKeyIssue: true,
            },
          ],
          achievements: [
            {
              title: 'Webhook handlers completed',
              description: 'Verified with mock events',
              isKeyAchievement: true,
            },
          ],
          hours: [{ taskType: 'Development', hours: 18 }],
          notes: 'Overall good progress this sprint',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('DRAFT');
      expect(res.body.data.currentVersion).toBe(0);
      expect(res.body.data.userId._id.toString()).toBe(member1._id.toString());

      createdReportId = res.body.data._id;
    });

    it('2. should reject duplicate report for the same user, project, and week', async () => {
      const res = await request(app)
        .post('/api/reports')
        .set('Cookie', member1Cookie)
        .send({
          projectId: project._id.toString(),
          weekStart: '2026-09-07T00:00:00.000Z',
          weekEnd: '2026-09-13T23:59:59.000Z',
        });

      expect(res.statusCode).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('3. should reject report creation by MANAGER_ADMIN with 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/reports')
        .set('Cookie', managerCookie)
        .send({
          projectId: project._id.toString(),
          weekStart: '2026-09-14T00:00:00.000Z',
          weekEnd: '2026-09-20T23:59:59.000Z',
        });

      expect(res.statusCode).toBe(403);
    });
  });

  // ==========================================
  // 2. Draft Editing & Ownership Boundaries
  // ==========================================
  describe('PUT /api/reports/:id', () => {
    it('4. should prevent another member from editing Alice’s draft report with 403 Forbidden', async () => {
      const res = await request(app)
        .put(`/api/reports/${createdReportId}`)
        .set('Cookie', member2Cookie)
        .send({
          notes: 'Attempting unauthorized edit',
        });

      expect(res.statusCode).toBe(403);
    });

    it('5. should allow author (Alice) to update her draft report', async () => {
      const res = await request(app)
        .put(`/api/reports/${createdReportId}`)
        .set('Cookie', member1Cookie)
        .send({
          notes: 'Updated sprint notes before submission',
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.notes).toBe('Updated sprint notes before submission');
    });
  });

  // ==========================================
  // 3. Report Submission & Version 1 Snapshot
  // ==========================================
  describe('PATCH /api/reports/:id/submit', () => {
    it('6. should reject submission by non-author with 403 Forbidden', async () => {
      const res = await request(app)
        .patch(`/api/reports/${createdReportId}/submit`)
        .set('Cookie', member2Cookie);

      expect(res.statusCode).toBe(403);
    });

    it('7. should successfully submit report, increment version to 1, and create immutable ReportVersion snapshot', async () => {
      const res = await request(app)
        .patch(`/api/reports/${createdReportId}/submit`)
        .set('Cookie', member1Cookie);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('SUBMITTED');
      expect(res.body.data.currentVersion).toBe(1);
      expect(res.body.data.submittedAt).toBeDefined();

      // Verify ReportVersion snapshot in DB
      const versions = await ReportVersion.find({ reportId: createdReportId });
      expect(versions).toHaveLength(1);
      expect(versions[0].versionNumber).toBe(1);
      expect(versions[0].content.notes).toBe('Updated sprint notes before submission');
      expect(versions[0].content.tasks).toHaveLength(1);
      expect(versions[0].submittedBy.toString()).toBe(member1._id.toString());

      // Verify ReviewHistory log entry
      const history = await ReviewHistory.find({ reportId: createdReportId });
      expect(history).toHaveLength(1);
      expect(history[0].action).toBe('SUBMITTED');
      expect(history[0].versionNumber).toBe(1);
    });

    it('8. should prevent editing a report once in SUBMITTED state', async () => {
      const res = await request(app)
        .put(`/api/reports/${createdReportId}`)
        .set('Cookie', member1Cookie)
        .send({ notes: 'Trying to edit submitted report' });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/cannot be edited/i);
    });
  });

  // ==========================================
  // 4. Review Workflow — Request Corrections
  // ==========================================
  describe('Manager Review — Request Correction', () => {
    it('9. should show the submitted report in manager pending inbox GET /api/reviews/pending', async () => {
      const res = await request(app)
        .get('/api/reviews/pending')
        .set('Cookie', managerCookie);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      const ids = res.body.data.map((r) => r._id);
      expect(ids).toContain(createdReportId);
    });

    it('10. should reject review actions by TEAM_MEMBER with 403 Forbidden', async () => {
      const res = await request(app)
        .patch(`/api/reviews/${createdReportId}/request-correction`)
        .set('Cookie', member1Cookie)
        .send({ comment: 'Illegal self-review' });

      expect(res.statusCode).toBe(403);
    });

    it('11. should reject correction request without a comment (400 Bad Request)', async () => {
      const res = await request(app)
        .patch(`/api/reviews/${createdReportId}/request-correction`)
        .set('Cookie', managerCookie)
        .send({ comment: '' });

      expect(res.statusCode).toBe(400);
    });

    it('12. should allow MANAGER_ADMIN to request corrections and change status to NEEDS_CORRECTION', async () => {
      const res = await request(app)
        .patch(`/api/reviews/${createdReportId}/request-correction`)
        .set('Cookie', managerCookie)
        .send({ comment: 'Please detail test coverage for webhook handler' });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('NEEDS_CORRECTION');
      expect(res.body.data.latestReviewComment).toBe('Please detail test coverage for webhook handler');

      // Verify ReviewHistory updated
      const history = await ReviewHistory.find({ reportId: createdReportId }).sort({ createdAt: 1 });
      expect(history).toHaveLength(2);
      expect(history[1].action).toBe('REQUESTED_CHANGES');
      expect(history[1].comment).toBe('Please detail test coverage for webhook handler');
    });
  });

  // ==========================================
  // 5. Revision & Resubmission (Version 2)
  // ==========================================
  describe('Report Resubmission (v2)', () => {
    it('13. should allow author to edit report now in NEEDS_CORRECTION state', async () => {
      const res = await request(app)
        .put(`/api/reports/${createdReportId}`)
        .set('Cookie', member1Cookie)
        .send({
          notes: 'Added 12 unit tests covering webhook payloads',
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.notes).toBe('Added 12 unit tests covering webhook payloads');
    });

    it('14. should allow author to resubmit, incrementing to version 2 while preserving version 1 snapshot', async () => {
      const res = await request(app)
        .patch(`/api/reports/${createdReportId}/submit`)
        .set('Cookie', member1Cookie);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.status).toBe('SUBMITTED');
      expect(res.body.data.currentVersion).toBe(2);

      // Verify version 1 and version 2 exist independently
      const versions = await ReportVersion.find({ reportId: createdReportId }).sort({ versionNumber: 1 });
      expect(versions).toHaveLength(2);
      expect(versions[0].versionNumber).toBe(1);
      expect(versions[0].content.notes).toBe('Updated sprint notes before submission'); // Unchanged v1
      expect(versions[1].versionNumber).toBe(2);
      expect(versions[1].content.notes).toBe('Added 12 unit tests covering webhook payloads'); // v2 snapshot
    });
  });

  // ==========================================
  // 6. Review Workflow — Approval & Immutability
  // ==========================================
  describe('Manager Review — Approval', () => {
    it('15. should allow MANAGER_ADMIN to approve the report', async () => {
      const res = await request(app)
        .patch(`/api/reviews/${createdReportId}/approve`)
        .set('Cookie', managerCookie)
        .send({ comment: 'Looks great now. Approved!' });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('APPROVED');
      expect(res.body.data.approvedAt).toBeDefined();

      const history = await ReviewHistory.find({ reportId: createdReportId }).sort({ createdAt: 1 });
      expect(history).toHaveLength(4); // SUBMIT(v1) -> REQUESTED_CHANGES(v1) -> SUBMIT(v2) -> APPROVED(v2)
      expect(history[3].action).toBe('APPROVED');
    });

    it('16. should reject attempts to edit an APPROVED report', async () => {
      const res = await request(app)
        .put(`/api/reports/${createdReportId}`)
        .set('Cookie', member1Cookie)
        .send({ notes: 'Modifying approved report' });

      expect(res.statusCode).toBe(400);
    });

    it('17. should reject attempts to resubmit an APPROVED report', async () => {
      const res = await request(app)
        .patch(`/api/reports/${createdReportId}/submit`)
        .set('Cookie', member1Cookie);

      expect(res.statusCode).toBe(400);
    });

    it('18. should reject deletion of an APPROVED report', async () => {
      const res = await request(app)
        .delete(`/api/reports/${createdReportId}`)
        .set('Cookie', member1Cookie);

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/Only DRAFT reports can be deleted/i);
    });

    it('19. should return full version history on GET /api/reports/:id/versions', async () => {
      const res = await request(app)
        .get(`/api/reports/${createdReportId}/versions`)
        .set('Cookie', member1Cookie);

      expect(res.statusCode).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0].versionNumber).toBe(1);
      expect(res.body.data[1].versionNumber).toBe(2);
    });

    it('20. should return full review timeline on GET /api/reviews/:id/history', async () => {
      const res = await request(app)
        .get(`/api/reviews/${createdReportId}/history`)
        .set('Cookie', managerCookie);

      expect(res.statusCode).toBe(200);
      expect(res.body.data).toHaveLength(4);
      expect(res.body.data[0].action).toBe('SUBMITTED');
      expect(res.body.data[1].action).toBe('REQUESTED_CHANGES');
      expect(res.body.data[2].action).toBe('SUBMITTED');
      expect(res.body.data[3].action).toBe('APPROVED');
    });
  });

  // ==========================================
  // 7. Draft Deletion Lifecycle
  // ==========================================
  describe('DELETE /api/reports/:id (Draft deletion)', () => {
    it('21. should allow member to delete their own DRAFT report', async () => {
      // Create a fresh draft
      const draftRes = await request(app)
        .post('/api/reports')
        .set('Cookie', member1Cookie)
        .send({
          projectId: project._id.toString(),
          weekStart: '2026-09-21T00:00:00.000Z',
          weekEnd: '2026-09-27T23:59:59.000Z',
        });

      const draftId = draftRes.body.data._id;

      const delRes = await request(app)
        .delete(`/api/reports/${draftId}`)
        .set('Cookie', member1Cookie);

      expect(delRes.statusCode).toBe(200);
      expect(delRes.body.success).toBe(true);

      const findReport = await Report.findById(draftId);
      expect(findReport).toBeNull();
    });
  });
});
