const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const config = require('../src/config/env');
const { User } = require('../src/models');

describe('Profile & Account Management API Tests', () => {
  let memberUser, managerUser;
  let memberToken, managerToken;
  let memberCookie, managerCookie;

  // 1x1 pixel valid PNG Data URI
  const validPngBase64 =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

  // Invalid file type data URI (text/plain)
  const invalidTxtBase64 =
    'data:text/plain;base64,SGVsbG8gV29ybGQh';

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

    memberUser = await User.create({
      name: 'Alex Profile Member',
      email: 'alex.profile@example.com',
      password: await bcrypt.hash('CurrentPass123!', 10),
      role: 'TEAM_MEMBER',
      isActive: true,
    });

    managerUser = await User.create({
      name: 'Morgan Manager',
      email: 'morgan.manager@example.com',
      password: await bcrypt.hash('CurrentPass123!', 10),
      role: 'MANAGER_ADMIN',
      isActive: true,
    });

    memberToken = createAuthToken(memberUser);
    managerToken = createAuthToken(managerUser);

    memberCookie = `${config.cookieName}=${memberToken}`;
    managerCookie = `${config.cookieName}=${managerToken}`;
  });

  afterAll(async () => {
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  describe('1. Profile Retrieval & Editing (PUT /api/users/me)', () => {
    it('should reject unauthenticated profile update with 401', async () => {
      const res = await request(app)
        .put('/api/users/me')
        .send({ name: 'Hacker Name' });

      expect(res.statusCode).toBe(401);
    });

    it('should allow TEAM_MEMBER to update their own name', async () => {
      const res = await request(app)
        .put('/api/users/me')
        .set('Cookie', memberCookie)
        .send({ name: 'Alex Johnson Updated' });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Alex Johnson Updated');

      const dbUser = await User.findById(memberUser._id);
      expect(dbUser.name).toBe('Alex Johnson Updated');
    });

    it('should prevent TEAM_MEMBER from escalating role or active status via /me', async () => {
      const res = await request(app)
        .put('/api/users/me')
        .set('Cookie', memberCookie)
        .send({ role: 'MANAGER_ADMIN', isActive: false });

      expect(res.statusCode).toBe(200);

      const dbUser = await User.findById(memberUser._id);
      expect(dbUser.role).toBe('TEAM_MEMBER');
      expect(dbUser.isActive).toBe(true);
    });

    it('should reject empty name on PUT /api/users/me', async () => {
      const res = await request(app)
        .put('/api/users/me')
        .set('Cookie', memberCookie)
        .send({ name: '   ' });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('2. Profile Picture Upload & Removal', () => {
    it('should allow user to upload a valid PNG avatar', async () => {
      const res = await request(app)
        .patch('/api/users/me/profile-picture')
        .set('Cookie', memberCookie)
        .send({ image: validPngBase64 });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.avatar).toMatch(/^\/uploads\/avatars\/avatar-/);

      const dbUser = await User.findById(memberUser._id);
      expect(dbUser.avatar).toMatch(/^\/uploads\/avatars\/avatar-/);
    });

    it('should reject invalid file format (non-image) with 400 Bad Request', async () => {
      const res = await request(app)
        .patch('/api/users/me/profile-picture')
        .set('Cookie', memberCookie)
        .send({ image: invalidTxtBase64 });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/Allowed formats: JPEG, PNG, WebP/i);
    });

    it('should reject missing image payload with 400 Bad Request', async () => {
      const res = await request(app)
        .patch('/api/users/me/profile-picture')
        .set('Cookie', memberCookie)
        .send({});

      expect(res.statusCode).toBe(400);
    });

    it('should allow user to remove their profile picture', async () => {
      const res = await request(app)
        .delete('/api/users/me/profile-picture')
        .set('Cookie', memberCookie);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.avatar).toBeNull();

      const dbUser = await User.findById(memberUser._id);
      expect(dbUser.avatar).toBeNull();
    });
  });

  describe('3. Password Change (PATCH /api/users/me/password)', () => {
    it('should reject password change with incorrect current password', async () => {
      const res = await request(app)
        .patch('/api/users/me/password')
        .set('Cookie', memberCookie)
        .send({
          currentPassword: 'WrongPassword123!',
          newPassword: 'BrandNewPass123!',
          confirmPassword: 'BrandNewPass123!',
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/current password is incorrect/i);
    });

    it('should reject password change when newPassword !== confirmPassword', async () => {
      const res = await request(app)
        .patch('/api/users/me/password')
        .set('Cookie', memberCookie)
        .send({
          currentPassword: 'CurrentPass123!',
          newPassword: 'BrandNewPass123!',
          confirmPassword: 'MismatchedPass123!',
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/do not match/i);
    });

    it('should reject password change when new password is same as current', async () => {
      const res = await request(app)
        .patch('/api/users/me/password')
        .set('Cookie', memberCookie)
        .send({
          currentPassword: 'CurrentPass123!',
          newPassword: 'CurrentPass123!',
          confirmPassword: 'CurrentPass123!',
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/cannot be the same/i);
    });


    it('should reject weak new password (< 8 characters)', async () => {
      const res = await request(app)
        .patch('/api/users/me/password')
        .set('Cookie', memberCookie)
        .send({
          currentPassword: 'CurrentPass123!',
          newPassword: 'short',
          confirmPassword: 'short',
        });

      expect(res.statusCode).toBe(400);
    });

    it('should successfully change password for authenticated user and not return password hash', async () => {
      const res = await request(app)
        .patch('/api/users/me/password')
        .set('Cookie', memberCookie)
        .send({
          currentPassword: 'CurrentPass123!',
          newPassword: 'SecureNewPassword123!',
          confirmPassword: 'SecureNewPassword123!',
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body).not.toHaveProperty('password');

      // Verify that new password works for login / bcrypt comparison
      const dbUser = await User.findById(memberUser._id).select('+password');
      const isMatch = await bcrypt.compare('SecureNewPassword123!', dbUser.password);
      expect(isMatch).toBe(true);
    });
  });
});
