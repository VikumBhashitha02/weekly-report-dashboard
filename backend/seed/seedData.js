const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('../src/config/env');
const { User, Project, Report, ReportVersion, ReviewHistory } = require('../src/models');

/**
 * Database Seed Script for Sisenco Assignment
 * Populates realistic demo records demonstrating all roles, statuses, versions, and review cycles.
 */
const seedDatabase = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(config.mongodbUri);
    console.log('Connected successfully.');

    console.log('Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      Project.deleteMany({}),
      Report.deleteMany({}),
      ReportVersion.deleteMany({}),
      ReviewHistory.deleteMany({}),
    ]);

    const hashedPassword = await bcrypt.hash('Password123!', 10);

    console.log('Creating users...');
    const manager = await User.create({
      name: 'Eleanor Vance',
      email: 'manager@example.com',
      password: hashedPassword,
      role: 'MANAGER_ADMIN',
      isActive: true,
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    });

    const member1 = await User.create({
      name: 'Alex Rivera',
      email: 'alex@example.com',
      password: hashedPassword,
      role: 'TEAM_MEMBER',
      isActive: true,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    });

    const member2 = await User.create({
      name: 'Sarah Chen',
      email: 'sarah@example.com',
      password: hashedPassword,
      role: 'TEAM_MEMBER',
      isActive: true,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    });

    console.log('Creating projects...');
    const proj1 = await Project.create({
      name: 'Payment Gateway Integration',
      description: 'Stripe, PayPal and Webhook processing pipeline',
      category: 'Fintech',
      assignedMembers: [member1._id, member2._id],
      isActive: true,
    });

    const proj2 = await Project.create({
      name: 'Cloud Infrastructure Modernization',
      description: 'Kubernetes migration and CI/CD automated deployment pipelines',
      category: 'DevOps',
      assignedMembers: [member1._id],
      isActive: true,
    });

    const proj3 = await Project.create({
      name: 'Mobile App Redesign',
      description: 'Next-generation React Native mobile shopping experience',
      category: 'Mobile',
      assignedMembers: [member2._id],
      isActive: true,
    });

    console.log('Creating reports & review lifecycles...');

    // 1. Approved Report (v2 after correction) by Alex
    const weekStart1 = new Date('2026-08-25T00:00:00.000Z');
    const weekEnd1 = new Date('2026-08-31T23:59:59.000Z');
    const approvedReport = await Report.create({
      userId: member1._id,
      projectId: proj1._id,
      weekStart: weekStart1,
      weekEnd: weekEnd1,
      status: 'APPROVED',
      currentVersion: 2,
      submittedAt: new Date('2026-08-31T18:00:00.000Z'),
      approvedAt: new Date('2026-09-01T10:30:00.000Z'),
      latestReviewComment: 'Approved! All webhook test cases verified.',
      tasks: [
        {
          taskName: 'Implement Stripe Checkout Session endpoint',
          priority: 'HIGH',
          plannedPercentage: 100,
          actualPercentage: 100,
          status: 'COMPLETED',
          plannedHours: 16,
          spentHours: 15,
          deliverable: 'PR #102 merged',
        },
        {
          taskName: 'Webhook signature validation middleware',
          priority: 'URGENT',
          plannedPercentage: 100,
          actualPercentage: 100,
          status: 'COMPLETED',
          plannedHours: 12,
          spentHours: 14,
          deliverable: 'PR #105 merged with 100% test coverage',
        },
      ],
      nextWeekTasks: [
        {
          taskName: 'PayPal SDK Integration',
          priority: 'HIGH',
          notes: 'Coordinate with billing department',
        },
      ],
      blockers: [],
      achievements: [
        {
          title: 'Zero-downtime payment deployment',
          description: 'Successfully deployed webhook handlers without dropping pending events',
          isKeyAchievement: true,
        },
      ],
      hours: [
        { taskType: 'Backend Development', hours: 25 },
        { taskType: 'Testing & QA', hours: 8 },
      ],
      notes: 'Completed all sprint goals on schedule.',
    });

    // Version 1 snapshot for approvedReport
    await ReportVersion.create({
      reportId: approvedReport._id,
      versionNumber: 1,
      content: {
        projectId: proj1._id,
        tasks: approvedReport.tasks.slice(0, 1),
        notes: 'Initial draft submission',
      },
      submittedBy: member1._id,
      submittedAt: new Date('2026-08-30T17:00:00.000Z'),
    });

    // Version 2 snapshot for approvedReport
    await ReportVersion.create({
      reportId: approvedReport._id,
      versionNumber: 2,
      content: {
        projectId: proj1._id,
        tasks: approvedReport.tasks,
        notes: 'Completed all sprint goals on schedule.',
      },
      submittedBy: member1._id,
      submittedAt: new Date('2026-08-31T18:00:00.000Z'),
    });

    // Review history for approvedReport
    await ReviewHistory.create([
      {
        reportId: approvedReport._id,
        reviewerId: member1._id,
        action: 'SUBMITTED',
        comment: 'Report submitted for review',
        versionNumber: 1,
        createdAt: new Date('2026-08-30T17:00:00.000Z'),
      },
      {
        reportId: approvedReport._id,
        reviewerId: manager._id,
        action: 'REQUESTED_CHANGES',
        comment: 'Please add webhook signature unit tests and hours breakdown',
        versionNumber: 1,
        createdAt: new Date('2026-08-31T09:00:00.000Z'),
      },
      {
        reportId: approvedReport._id,
        reviewerId: member1._id,
        action: 'SUBMITTED',
        comment: 'Resubmitted with requested unit tests',
        versionNumber: 2,
        createdAt: new Date('2026-08-31T18:00:00.000Z'),
      },
      {
        reportId: approvedReport._id,
        reviewerId: manager._id,
        action: 'APPROVED',
        comment: 'Approved! All webhook test cases verified.',
        versionNumber: 2,
        createdAt: new Date('2026-09-01T10:30:00.000Z'),
      },
    ]);

    // 2. Pending Review Report (SUBMITTED) by Sarah
    const weekStart2 = new Date('2026-09-01T00:00:00.000Z');
    const weekEnd2 = new Date('2026-09-07T23:59:59.000Z');
    const pendingReport = await Report.create({
      userId: member2._id,
      projectId: proj3._id,
      weekStart: weekStart2,
      weekEnd: weekEnd2,
      status: 'SUBMITTED',
      currentVersion: 1,
      submittedAt: new Date('2026-09-07T16:45:00.000Z'),
      tasks: [
        {
          taskName: 'Design Navigation Drawer & Tab Bar in React Native',
          priority: 'MEDIUM',
          plannedPercentage: 100,
          actualPercentage: 90,
          status: 'IN_PROGRESS',
          plannedHours: 20,
          spentHours: 19,
          deliverable: 'UI prototype branch',
        },
      ],
      nextWeekTasks: [
        {
          taskName: 'Product catalog filtering animations',
          priority: 'HIGH',
          notes: 'Using react-native-reanimated',
        },
      ],
      blockers: [
        {
          title: 'iOS gesture conflicts with modal sheet',
          description: 'Investigating react-native-gesture-handler config',
          isKeyIssue: false,
        },
      ],
      achievements: [
        {
          title: 'Dark mode theme token architecture',
          description: 'Tailwind React Native dynamic stylesheet created',
          isKeyAchievement: true,
        },
      ],
      hours: [
        { taskType: 'Frontend UI', hours: 22 },
        { taskType: 'Code Review', hours: 4 },
      ],
      notes: 'Ready for manager review.',
    });

    await ReportVersion.create({
      reportId: pendingReport._id,
      versionNumber: 1,
      content: {
        projectId: proj3._id,
        tasks: pendingReport.tasks,
        notes: pendingReport.notes,
      },
      submittedBy: member2._id,
      submittedAt: new Date('2026-09-07T16:45:00.000Z'),
    });

    await ReviewHistory.create({
      reportId: pendingReport._id,
      reviewerId: member2._id,
      action: 'SUBMITTED',
      comment: 'Initial submission for week of Sept 1',
      versionNumber: 1,
    });

    // 3. Draft Report by Alex
    const weekStart3 = new Date('2026-09-08T00:00:00.000Z');
    const weekEnd3 = new Date('2026-09-14T23:59:59.000Z');
    await Report.create({
      userId: member1._id,
      projectId: proj2._id,
      weekStart: weekStart3,
      weekEnd: weekEnd3,
      status: 'DRAFT',
      currentVersion: 0,
      tasks: [
        {
          taskName: 'Setup ArgoCD deployment manifests',
          priority: 'HIGH',
          plannedPercentage: 50,
          actualPercentage: 30,
          status: 'IN_PROGRESS',
          plannedHours: 15,
          spentHours: 10,
          deliverable: 'k8s/argocd/ application.yaml',
        },
      ],
      notes: 'Work in progress draft.',
    });

    console.log('\n=============================================');
    console.log('Demo Database Seed Completed Successfully!');
    console.log('=============================================');
    console.log('Demo Credentials:');
    console.log('1. Manager/Admin:  manager@example.com  / Password123!');
    console.log('2. Team Member 1:  alex@example.com     / Password123!');
    console.log('3. Team Member 2:  sarah@example.com    / Password123!');
    console.log('=============================================\n');

    process.exit(0);
  } catch (error) {
    console.error('Seed Error:', error);
    process.exit(1);
  }
};

seedDatabase();
