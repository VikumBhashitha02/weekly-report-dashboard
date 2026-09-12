const { z } = require('zod');
const ApiError = require('../../utils/apiError');

// ==========================================
// Sub-schemas (matching Report model structure)
// ==========================================

const taskSchema = z.object({
  taskName: z.string().trim().min(1, 'Task name is required'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  plannedPercentage: z.number().min(0).max(100).default(0),
  actualPercentage: z.number().min(0).max(100).default(0),
  status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED']).default('NOT_STARTED'),
  plannedHours: z.number().min(0).default(0),
  spentHours: z.number().min(0).default(0),
  deliverable: z.string().trim().default(''),
});

const nextWeekTaskSchema = z.object({
  taskName: z.string().trim().min(1, 'Next week task name is required'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  notes: z.string().trim().default(''),
});

const blockerSchema = z.object({
  title: z.string().trim().min(1, 'Blocker title is required'),
  description: z.string().trim().default(''),
  isKeyIssue: z.boolean().default(false),
});

const achievementSchema = z.object({
  title: z.string().trim().min(1, 'Achievement title is required'),
  description: z.string().trim().default(''),
  isKeyAchievement: z.boolean().default(false),
});

const hoursByTypeSchema = z.object({
  taskType: z.string().trim().min(1, 'Task type is required'),
  hours: z.number().min(0, 'Hours cannot be negative'),
});

// ==========================================
// Report Schemas
// ==========================================

/**
 * Schema for creating or saving a draft report.
 * Most fields are optional to allow incremental saving.
 */
const createReportSchema = z.object({
  projectId: z
    .string({ required_error: 'projectId is required' })
    .regex(/^[a-f\d]{24}$/i, 'projectId must be a valid MongoDB ObjectId'),
  weekStart: z
    .string({ required_error: 'weekStart is required' })
    .datetime({ message: 'weekStart must be a valid ISO 8601 date string' }),
  weekEnd: z
    .string({ required_error: 'weekEnd is required' })
    .datetime({ message: 'weekEnd must be a valid ISO 8601 date string' }),
  tasks: z.array(taskSchema).default([]),
  nextWeekTasks: z.array(nextWeekTaskSchema).default([]),
  blockers: z.array(blockerSchema).default([]),
  achievements: z.array(achievementSchema).default([]),
  hours: z.array(hoursByTypeSchema).default([]),
  notes: z.string().trim().default(''),
  links: z.array(z.string().url('Each link must be a valid URL')).default([]),
});

/**
 * Schema for updating an existing draft report.
 * All fields optional — partial update supported.
 */
const updateReportSchema = z.object({
  tasks: z.array(taskSchema).optional(),
  nextWeekTasks: z.array(nextWeekTaskSchema).optional(),
  blockers: z.array(blockerSchema).optional(),
  achievements: z.array(achievementSchema).optional(),
  hours: z.array(hoursByTypeSchema).optional(),
  notes: z.string().trim().optional(),
  links: z.array(z.string().url('Each link must be a valid URL')).optional(),
});

// ==========================================
// Validation Middleware Factory
// ==========================================

const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const errors = result.error.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return next(ApiError.badRequest('Validation failed', errors));
  }
  req.body = result.data;
  next();
};

module.exports = { createReportSchema, updateReportSchema, validate };
