/**
 * Utility functions for user avatars and initials
 */

const BACKEND_BASE_URL = (
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
).replace(/\/api\/?$/, '');

/**
 * Resolves a full image URL for an avatar path
 * @param {string|null} avatar 
 * @returns {string|null}
 */
export function getAvatarUrl(avatar) {
  if (!avatar) return null;
  if (avatar.startsWith('http://') || avatar.startsWith('https://') || avatar.startsWith('data:')) {
    return avatar;
  }
  if (avatar.startsWith('/')) {
    return `${BACKEND_BASE_URL}${avatar}`;
  }
  return `${BACKEND_BASE_URL}/${avatar}`;
}

/**
 * Extracts initials from a user's full name
 * Examples:
 *   "Alex Johnson" -> "AJ"
 *   "Sarah" -> "S"
 *   "Manager Admin User" -> "MA"
 * @param {string} name 
 * @returns {string}
 */
export function getInitials(name) {
  if (!name || typeof name !== 'string') return 'U';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}
