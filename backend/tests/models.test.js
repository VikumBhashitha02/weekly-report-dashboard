const mongoose = require('mongoose');
const { User, Project, Report, ReportVersion, ReviewHistory } = require('../src/models');
const config = require('../src/config/env');

describe('Mongoose Models Schema & Validation Tests', () => {
  beforeAll(async () => {
    // Connect to test database
    const testDbUri = config.mongodbUri.includes('?')
      ? config.mongodbUri.replace('?', '_test?')
      : `${config.mongodbUri}_test`;
    
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(testDbUri);
    }
    // Clear test collections and ensure indexes are created
    await Promise.all([
      User.deleteMany({}),
      Project.deleteMany({}),
      Report.deleteMany({}),
      ReportVersion.deleteMany({}),
      ReviewHistory.deleteMany({}),
    ]);
    await Promise.all([
      User.syncIndexes(),
      Project.syncIndexes(),
      Report.syncIndexes(),
      ReportVersion.syncIndexes(),
      ReviewHistory.syncIndexes(),
    ]);
  });

  afterAll(async () => {
    // Clean up test collections and disconnect
    await Promise.all([
      User.deleteMany({}),
      Project.deleteMany({}),
      Report.deleteMany({}),
      ReportVersion.deleteMany({}),
      ReviewHistory.deleteMany({}),
    ]);
    await mongoose.connection.close();
  });

  // ==========================================
  // 1. User Model Tests
  // ==========================================
  describe('User Model', () => {
    it('should create and validate a valid User successfully', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: 'securePassword123',
        role: 'TEAM_MEMBER',
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser._id).toBeDefined();
      expect(savedUser.name).toBe('John Doe');
      expect(savedUser.email).toBe('john.doe@example.com');
      expect(savedUser.role).toBe('TEAM_MEMBER');
      expect(savedUser.isActive).toBe(true);
    });

    it('should create and validate a valid User with MANAGER_ADMIN role', async () => {
      const managerAdmin = new User({
        name: 'Manager Admin User',
        email: 'manager.admin@example.com',
        password: 'securePassword123',
        role: 'MANAGER_ADMIN',
      });
      const savedUser = await managerAdmin.save();

      expect(savedUser._id).toBeDefined();
      expect(savedUser.role).toBe('MANAGER_ADMIN');
    });

    it('should default role to TEAM_MEMBER when role is omitted', async () => {
      const defaultUser = new User({
        name: 'Default Role User',
        email: 'default.role@example.com',
        password: 'securePassword123',
      });
      const savedUser = await defaultUser.save();

      expect(savedUser._id).toBeDefined();
      expect(savedUser.role).toBe('TEAM_MEMBER');
    });

    it('should reject invalid User role such as ADMIN or SUPER_HERO', async () => {
      const userWithAdminRole = new User({
        name: 'Jane Admin',
        email: 'jane.admin@example.com',
        password: 'password123',
        role: 'ADMIN', // Invalid role - must be rejected
      });

      let err = null;
      try {
        await userWithAdminRole.validate();
      } catch (error) {
        err = error;
      }

      expect(err).toBeDefined();
      expect(err.errors.role).toBeDefined();
    });

    it('should reject a duplicate User email', async () => {
      const user1 = new User({
        name: 'Alice',
        email: 'duplicate@example.com',
        password: 'password123',
      });
      await user1.save();

      const user2 = new User({
        name: 'Bob',
        email: 'duplicate@example.com',
        password: 'password456',
      });

      let err = null;
      try {
        await user2.save();
      } catch (error) {
        err = error;
      }

      expect(err).toBeDefined();
      expect(err.code).toBe(11000); // MongoDB duplicate key error code
    });

    it('should exclude password field from standard query results by default', async () => {
      const user = await User.findOne({ email: 'john.doe@example.com' });
      expect(user).toBeDefined();
      expect(user.password).toBeUndefined();
    });
  });

  // ==========================================
  // 2. Project Model Tests
  // ==========================================
  describe('Project Model', () => {
    it('should create and validate a valid Project successfully', async () => {
      const testUser = await User.findOne({ email: 'john.doe@example.com' });

      const projectData = {
        name: 'Sisenco Reporting Portal',
        description: 'Internal weekly reporting tool for engineers',
        category: 'Engineering',
        assignedMembers: [testUser._id],
      };

      const project = new Project(projectData);
      const savedProject = await project.save();

      expect(savedProject._id).toBeDefined();
      expect(savedProject.name).toBe('Sisenco Reporting Portal');
      expect(savedProject.isActive).toBe(true);
      expect(savedProject.assignedMembers.length).toBe(1);
    });

    it('should reject a duplicate Project name', async () => {
      const duplicateProject = new Project({
        name: 'Sisenco Reporting Portal', // Same name
        description: 'Duplicate attempt',
      });

      let err = null;
      try {
        await duplicateProject.save();
      } catch (error) {
        err = error;
      }

      expect(err).toBeDefined();
      expect(err.code).toBe(11000);
    });
  });

  // ==========================================
  // 3. Report Model Tests
  // ==========================================
  describe('Report Model', () => {
    let testUser;
    let testProject;

    beforeAll(async () => {
      testUser = await User.findOne({ email: 'john.doe@example.com' });
      testProject = await Project.findOne({ name: 'Sisenco Reporting Portal' });
    });

    it('should create and validate a valid Report with tasks, blockers, achievements, and hours', async () => {
      const reportData = {
        userId: testUser._id,
        projectId: testProject._id,
        weekStart: new Date('2026-09-07'),
        weekEnd: new Date('2026-09-11'),
        status: 'DRAFT',
        tasks: [
          {
            taskName: 'Implement User and Project Mongoose Models',
            priority: 'HIGH',
            plannedPercentage: 100,
            actualPercentage: 100,
            status: 'COMPLETED',
            plannedHours: 8,
            spentHours: 6.5,
            deliverable: 'Mongoose schemas with tests',
          },
        ],
        nextWeekTasks: [
          {
            taskName: 'Implement Authentication & JWT Middleware',
            priority: 'HIGH',
            notes: 'Phase 3 work',
          },
        ],
        blockers: [
          {
            title: 'CI Pipeline setup',
            description: 'Awaiting runner access',
            isKeyIssue: true,
          },
        ],
        achievements: [
          {
            title: 'Completed Phase 1 & 2 ahead of schedule',
            description: '100% test coverage on schemas',
            isKeyAchievement: true,
          },
        ],
        hours: [
          {
            taskType: 'Development',
            hours: 6.5,
          },
        ],
      };

      const report = new Report(reportData);
      const savedReport = await report.save();

      expect(savedReport._id).toBeDefined();
      expect(savedReport.status).toBe('DRAFT');
      expect(savedReport.tasks.length).toBe(1);
      expect(savedReport.blockers.length).toBe(1);
      expect(savedReport.achievements.length).toBe(1);
      expect(savedReport.hours.length).toBe(1);
      expect(savedReport.currentVersion).toBe(0);
    });

    it('should reject an invalid Report status', async () => {
      const invalidReport = new Report({
        userId: testUser._id,
        projectId: testProject._id,
        weekStart: new Date('2026-09-07'),
        weekEnd: new Date('2026-09-11'),
        status: 'CANCELLED_BY_USER', // Invalid status enum
      });

      let err = null;
      try {
        await invalidReport.validate();
      } catch (error) {
        err = error;
      }

      expect(err).toBeDefined();
      expect(err.errors.status).toBeDefined();
    });

    it('should reject a task percentage outside 0-100', async () => {
      const invalidPercentageReport = new Report({
        userId: testUser._id,
        projectId: testProject._id,
        weekStart: new Date('2026-09-07'),
        weekEnd: new Date('2026-09-11'),
        tasks: [
          {
            taskName: 'Over-completed task',
            plannedPercentage: 150, // Invalid > 100
          },
        ],
      });

      let err = null;
      try {
        await invalidPercentageReport.validate();
      } catch (error) {
        err = error;
      }

      expect(err).toBeDefined();
      expect(err.errors['tasks.0.plannedPercentage']).toBeDefined();
    });

    it('should reject negative hours in task and hours breakdown', async () => {
      const negativeHoursReport = new Report({
        userId: testUser._id,
        projectId: testProject._id,
        weekStart: new Date('2026-09-07'),
        weekEnd: new Date('2026-09-11'),
        tasks: [
          {
            taskName: 'Task with negative hours',
            spentHours: -5, // Invalid negative hours
          },
        ],
        hours: [
          {
            taskType: 'Bugfix',
            hours: -2, // Invalid negative hours
          },
        ],
      });

      let err = null;
      try {
        await negativeHoursReport.validate();
      } catch (error) {
        err = error;
      }

      expect(err).toBeDefined();
      expect(err.errors['tasks.0.spentHours']).toBeDefined();
      expect(err.errors['hours.0.hours']).toBeDefined();
    });
  });

  // ==========================================
  // 4. ReportVersion Model Tests
  // ==========================================
  describe('ReportVersion Model', () => {
    let testUser;
    let testReport;

    beforeAll(async () => {
      testUser = await User.findOne({ email: 'john.doe@example.com' });
      testReport = await Report.findOne({ userId: testUser._id });
    });

    it('should create and validate a valid ReportVersion snapshot', async () => {
      const version = new ReportVersion({
        reportId: testReport._id,
        versionNumber: 1,
        content: testReport.toObject(),
        submittedBy: testUser._id,
        submittedAt: new Date(),
      });

      const savedVersion = await version.save();

      expect(savedVersion._id).toBeDefined();
      expect(savedVersion.versionNumber).toBe(1);
      expect(savedVersion.content).toBeDefined();
      expect(savedVersion.submittedBy.toString()).toBe(testUser._id.toString());
    });

    it('should reject duplicate versionNumber for the same reportId', async () => {
      const duplicateVersion = new ReportVersion({
        reportId: testReport._id,
        versionNumber: 1, // Duplicate version 1
        content: testReport.toObject(),
        submittedBy: testUser._id,
        submittedAt: new Date(),
      });

      let err = null;
      try {
        await duplicateVersion.save();
      } catch (error) {
        err = error;
      }

      expect(err).toBeDefined();
      expect(err.code).toBe(11000);
    });
  });

  // ==========================================
  // 5. ReviewHistory Model Tests
  // ==========================================
  describe('ReviewHistory Model', () => {
    let testUser;
    let testReport;

    beforeAll(async () => {
      testUser = await User.findOne({ email: 'john.doe@example.com' });
      testReport = await Report.findOne({ userId: testUser._id });
    });

    it('should create a valid ReviewHistory entry', async () => {
      const review = new ReviewHistory({
        reportId: testReport._id,
        reviewerId: testUser._id,
        action: 'APPROVED',
        comment: 'Great progress this week! Clean deliverable.',
        versionNumber: 1,
      });

      const savedReview = await review.save();

      expect(savedReview._id).toBeDefined();
      expect(savedReview.action).toBe('APPROVED');
      expect(savedReview.versionNumber).toBe(1);
    });

    it('should reject an invalid ReviewHistory action', async () => {
      const invalidReview = new ReviewHistory({
        reportId: testReport._id,
        reviewerId: testUser._id,
        action: 'REJECTED_PERMANENTLY', // Invalid action enum
        versionNumber: 1,
      });

      let err = null;
      try {
        await invalidReview.validate();
      } catch (error) {
        err = error;
      }

      expect(err).toBeDefined();
      expect(err.errors.action).toBeDefined();
    });
  });
});
