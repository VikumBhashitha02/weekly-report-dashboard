const mongoose = require('mongoose');

/**
 * ReviewHistory Model
 * Tracks the complete chronological review timeline and reviewer feedback across report versions.
 */
const reviewHistorySchema = new mongoose.Schema(
  {
    reportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Report',
      required: [true, 'Report ID is required'],
    },
    reviewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reviewer user ID is required'],
    },
    action: {
      type: String,
      enum: {
        values: ['SUBMITTED', 'REQUESTED_CHANGES', 'APPROVED'],
        message: '{VALUE} is not a valid review action',
      },
      required: [true, 'Review action is required'],
    },
    comment: {
      type: String,
      trim: true,
      default: '',
    },
    versionNumber: {
      type: Number,
      required: [true, 'Version number is required'],
      min: [1, 'Version number must be at least 1'],
    },
  },
  {
    timestamps: true,
  }
);

// Performance Indexes for timeline retrieval
reviewHistorySchema.index({ reportId: 1, createdAt: -1 });
reviewHistorySchema.index({ reviewerId: 1 });

const ReviewHistory = mongoose.model('ReviewHistory', reviewHistorySchema);

module.exports = ReviewHistory;
