const mongoose = require('mongoose');

/**
 * ReportVersion Model
 * Represents an immutable snapshot of a report captured at submission time.
 * Modifications to existing versions are prohibited to preserve historical audit integrity.
 */
const reportVersionSchema = new mongoose.Schema(
  {
    reportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Report',
      required: [true, 'Report ID is required'],
    },
    versionNumber: {
      type: Number,
      required: [true, 'Version number is required'],
      min: [1, 'Version number must be at least 1'],
    },
    content: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, 'Version content snapshot is required'],
    },
    submittedAt: {
      type: Date,
      required: [true, 'Submission date is required'],
      default: Date.now,
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Submitter user ID is required'],
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index ensuring a report cannot have duplicate version numbers
reportVersionSchema.index({ reportId: 1, versionNumber: 1 }, { unique: true });
reportVersionSchema.index({ submittedBy: 1 });

const ReportVersion = mongoose.model('ReportVersion', reportVersionSchema);

module.exports = ReportVersion;
