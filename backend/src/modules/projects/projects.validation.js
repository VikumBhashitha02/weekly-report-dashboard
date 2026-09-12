const { z } = require('zod');
const ApiError = require('../../utils/apiError');

// ==========================================
// Zod Schemas
// ==========================================

const createProjectSchema = z.object({
  name: z
    .string({ required_error: 'Project name is required' })
    .trim()
    .min(2, 'Project name must be at least 2 characters')
    .max(150, 'Project name cannot exceed 150 characters'),
  description: z.string().trim().max(500, 'Description cannot exceed 500 characters').optional(),
  category: z.string().trim().max(100, 'Category cannot exceed 100 characters').optional(),
});

const updateProjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Project name must be at least 2 characters')
    .max(150, 'Project name cannot exceed 150 characters')
    .optional(),
  description: z.string().trim().max(500, 'Description cannot exceed 500 characters').optional(),
  category: z.string().trim().max(100, 'Category cannot exceed 100 characters').optional(),
  isActive: z.boolean().optional(),
});

const assignMembersSchema = z.object({
  memberIds: z
    .array(z.string().regex(/^[a-f\d]{24}$/i, 'Each memberId must be a valid MongoDB ObjectId'))
    .min(1, 'At least one memberId is required'),
});

// ==========================================
// Validation Middleware Factory
// ==========================================

/**
 * Returns Express middleware that validates req.body against a Zod schema.
 * Passes field-level validation errors to the error handler on failure.
 * @param {import('zod').ZodSchema} schema
 */
const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const errors = result.error.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return next(ApiError.badRequest('Validation failed', errors));
  }
  req.body = result.data; // Replace with sanitized data
  next();
};

module.exports = { createProjectSchema, updateProjectSchema, assignMembersSchema, validate };
