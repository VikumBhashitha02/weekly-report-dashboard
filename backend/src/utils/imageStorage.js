const fs = require('fs');
const path = require('path');
const ApiError = require('./apiError');

const UPLOADS_DIR = path.join(__dirname, '../../uploads/avatars');

// Ensure upload directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

/**
 * Validates base64 image data URI, inspects binary magic bytes,
 * generates a safe unique filename, and saves to the avatars upload folder.
 *
 * @param {string} base64String - Data URL string (e.g. data:image/png;base64,...)
 * @param {string} userId - Authenticated user ObjectId
 * @returns {string} Relative URL path to stored avatar
 */
const validateAndSaveAvatar = (base64String, userId) => {
  if (!base64String || typeof base64String !== 'string') {
    throw ApiError.badRequest('Invalid image data provided.');
  }

  // Format: data:image/(jpeg|jpg|png|webp);base64,...
  const matches = base64String.match(/^data:image\/(jpeg|jpg|png|webp);base64,(.+)$/i);
  if (!matches) {
    throw ApiError.badRequest('Invalid image format. Allowed formats: JPEG, PNG, WebP.');
  }

  const mimeType = matches[1].toLowerCase();
  const rawBase64 = matches[2];
  const buffer = Buffer.from(rawBase64, 'base64');

  if (buffer.length === 0) {
    throw ApiError.badRequest('Uploaded image file is empty.');
  }

  if (buffer.length > MAX_FILE_SIZE) {
    throw ApiError.badRequest('Image file size exceeds the 5MB limit.');
  }

  // Inspect file signature (magic bytes) to prevent disguised executable uploads
  let ext = 'jpg';
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
    ext = 'png';
  } else if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    ext = 'webp';
  } else if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    ext = 'jpg';
  } else {
    throw ApiError.badRequest('Invalid image content. File signature does not match JPEG, PNG, or WebP.');
  }

  // Generate safe filename without using client-provided filename (prevents path traversal)
  const safeFilename = `avatar-${userId}-${Date.now()}.${ext}`;
  const targetPath = path.join(UPLOADS_DIR, safeFilename);

  fs.writeFileSync(targetPath, buffer);

  return `/uploads/avatars/${safeFilename}`;
};

/**
 * Safely removes a stored avatar file from disk if it exists in the uploads directory.
 *
 * @param {string} avatarUrl - Relative avatar URL path
 */
const deleteAvatarFile = (avatarUrl) => {
  if (!avatarUrl || typeof avatarUrl !== 'string' || !avatarUrl.startsWith('/uploads/avatars/')) {
    return;
  }
  const filename = path.basename(avatarUrl);
  const filePath = path.join(UPLOADS_DIR, filename);
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch {
      // Ignore file deletion errors
    }
  }
};

module.exports = {
  validateAndSaveAvatar,
  deleteAvatarFile,
  UPLOADS_DIR,
  MAX_FILE_SIZE,
};
