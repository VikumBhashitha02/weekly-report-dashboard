const mongoose = require('mongoose');

// Task Sub-Schema
const taskSchema = new mongoose.Schema(
  {
    taskName: {
      type: String,
      required: [true, 'Task name is required'],
      trim: true,
    },
    priority: {
      type: String,
      enum: {
        values: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
        message: '{VALUE} is not a valid task priority',
      },
      default: 'MEDIUM',
    },
    plannedPercentage: {
      type: Number,
      min: [0, 'Planned percentage cannot be less than 0'],
      max: [100, 'Planned percentage cannot exceed 100'],
      default: 0,
    },
    actualPercentage: {
      type: Number,
      min: [0, 'Actual percentage cannot be less than 0'],
      max: [100, 'Actual percentage cannot exceed 100'],
      default: 0,
    },
    status: {
      type: String,
      enum: {
        values: ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED'],
        message: '{VALUE} is not a valid task status',
      },
      default: 'NOT_STARTED',
    },
    plannedHours: {
      type: Number,
      min: [0, 'Planned hours cannot be negative'],
      default: 0,
    },
    spentHours: {
      type: Number,
      min: [0, 'Spent hours cannot be negative'],
      default: 0,
    },
    deliverable: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { _id: true }
);

// Next Week Task Sub-Schema
const nextWeekTaskSchema = new mongoose.Schema(
  {
    taskName: {
      type: String,
      required: [true, 'Next week task name is required'],
      trim: true,
    },
    priority: {
      type: String,
      enum: {
        values: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
        message: '{VALUE} is not a valid priority',
      },
      default: 'MEDIUM',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { _id: true }
);

// Blocker Sub-Schema
const blockerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Blocker title is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    isKeyIssue: {
      type: Boolean,
      default: false,
    },
  },
  { _id: true }
);

// Achievement Sub-Schema
const achievementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Achievement title is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    isKeyAchievement: {
      type: Boolean,
      default: false,
    },
  },
  { _id: true }
);

// Task Type Hours Sub-Schema
const hoursByTypeSchema = new mongoose.Schema(
  {
    taskType: {
      type: String,
      required: [true, 'Task type is required'],
      trim: true,
    },
    hours: {
      type: Number,
      required: [true, 'Hours are required'],
      min: [0, 'Hours cannot be negative'],
    },
  },
  { _id: false }
);

// Main Report Schema
const reportSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project ID is required'],
    },
    weekStart: {
      type: Date,
      required: [true, 'Week start date is required'],
    },
    weekEnd: {
      type: Date,
      required: [true, 'Week end date is required'],
    },
    status: {
      type: String,
      enum: {
        values: ['DRAFT', 'SUBMITTED', 'NEEDS_CORRECTION', 'APPROVED'],
        message: '{VALUE} is not a valid report status',
      },
      default: 'DRAFT',
    },
    tasks: {
      type: [taskSchema],
      default: [],
    },
    nextWeekTasks: {
      type: [nextWeekTaskSchema],
      default: [],
    },
    blockers: {
      type: [blockerSchema],
      default: [],
    },
    achievements: {
      type: [achievementSchema],
      default: [],
    },
    hours: {
      type: [hoursByTypeSchema],
      default: [],
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    links: {
      type: [String],
      default: [],
    },
    latestReviewComment: {
      type: String,
      trim: true,
      default: null,
    },
    currentVersion: {
      type: Number,
      default: 0,
      min: [0, 'Version cannot be negative'],
    },
    submittedAt: {
      type: Date,
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Performance & Query Indexes
reportSchema.index({ userId: 1, weekStart: -1 });
reportSchema.index({ projectId: 1, weekStart: -1 });
reportSchema.index({ status: 1 });
reportSchema.index({ userId: 1, projectId: 1, weekStart: 1 });

const Report = mongoose.model('Report', reportSchema);

module.exports = Report;
