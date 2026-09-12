const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const app = require('../src/app');
const config = require('../src/config/env');
const { User } = require('../src/models');
const authorizeRoles = require('../src/middleware/authorizeRoles');

describe('Authentication & Role-Based Access Control (RBAC) Tests', () => {
  beforeAll(async () => {
    const testDbUri = config.mongodbUri.includes('?')
      ? config.mongodbUri.replace('?', '_test?')
      : `${config.mongodbUri}_test`;

    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(testDbUri);
    }

    await User.deleteMany({});
    await User.syncIndexes();
  });

  afterAll(async () => {
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  // ==========================================
  // 1. Registration Tests
  // ==========================================
  describe('POST /api/auth/register', () => {
    it('1. should register a new TEAM_MEMBER successfully', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Sarah Connor',
          email: 'sarah@example.com',
          password: 'Password123!',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.name).toBe('Sarah Connor');
      expect(res.body.data.email).toBe('sarah@example.com');
      expect(res.body.data.role).toBe('TEAM_MEMBER');
      expect(res.body.data.password).toBeUndefined();

      // Verify cookie is attached
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies[0]).toMatch(/auth_token=/);
      expect(cookies[0]).toMatch(/HttpOnly/i);
    });

    it('2. should verify default role becomes TEAM_MEMBER in the database', async () => {
      const dbUser = await User.findOne({ email: 'sarah@example.com' });
      expect(dbUser).toBeDefined();
      expect(dbUser.role).toBe('TEAM_MEMBER');
    });

    it('3. should verify password is stored as a bcrypt hash, not plaintext', async () => {
      const dbUser = await User.findOne({ email: 'sarah@example.com' }).select('+password');
      expect(dbUser.password).not.toBe('Password123!');
      expect(dbUser.password).toMatch(/^\$2[aby]\$\d+\$/); // Valid bcrypt hash pattern

      const isMatch = await bcrypt.compare('Password123!', dbUser.password);
      expect(isMatch).toBe(true);
    });

    it('4. should verify password is never returned in registration response', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'John Reese',
          email: 'john.reese@example.com',
          password: 'Password123!',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.data.password).toBeUndefined();
    });

    it('5. should reject duplicate email registration with 409 Conflict', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Sarah Duplicate',
          email: 'sarah@example.com',
          password: 'Password123!',
        });

      expect(res.statusCode).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/already exists/i);
    });

    it('6. should reject invalid email with 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Invalid Email User',
          email: 'not-an-email',
          password: 'Password123!',
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('7. should reject missing required fields with 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'missingname@example.com',
          password: 'Password123!',
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('8. should prevent privilege escalation when client passes role: MANAGER_ADMIN', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Escalation Attempt',
          email: 'escalate@example.com',
          password: 'Password123!',
          role: 'MANAGER_ADMIN',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.data.role).toBe('TEAM_MEMBER'); // Strictly coerced to TEAM_MEMBER

      const dbUser = await User.findOne({ email: 'escalate@example.com' });
      expect(dbUser.role).toBe('TEAM_MEMBER');
    });

    it('9. should ignore/reject attempts to register with role: ADMIN', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Admin Attempt',
          email: 'adminattempt@example.com',
          password: 'Password123!',
          role: 'ADMIN',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.data.role).toBe('TEAM_MEMBER');

      const dbUser = await User.findOne({ email: 'adminattempt@example.com' });
      expect(dbUser.role).toBe('TEAM_MEMBER');
    });

    it('10. should ignore/reject attempts to register with role: MANAGER', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Manager Attempt',
          email: 'managerattempt@example.com',
          password: 'Password123!',
          role: 'MANAGER',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.data.role).toBe('TEAM_MEMBER');

      const dbUser = await User.findOne({ email: 'managerattempt@example.com' });
      expect(dbUser.role).toBe('TEAM_MEMBER');
    });
  });

  // ==========================================
  // 2. Login Tests
  // ==========================================
  describe('POST /api/auth/login', () => {
    beforeAll(async () => {
      // Create a MANAGER_ADMIN and an inactive user for testing
      const hashedPassword = await bcrypt.hash('Password123!', 10);
      await User.create([
        {
          name: 'Lead Manager Admin',
          email: 'manager.admin@example.com',
          password: hashedPassword,
          role: 'MANAGER_ADMIN',
          isActive: true,
        },
        {
          name: 'Inactive Dave',
          email: 'inactive@example.com',
          password: hashedPassword,
          role: 'TEAM_MEMBER',
          isActive: false,
        },
      ]);
    });

    it('11. should login successfully with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'sarah@example.com',
          password: 'Password123!',
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe('sarah@example.com');
      expect(res.body.data.role).toBe('TEAM_MEMBER');
    });

    it('12. should create a valid HTTP-only session cookie on login', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'sarah@example.com',
          password: 'Password123!',
        });

      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies[0]).toMatch(/auth_token=/);
      expect(cookies[0]).toMatch(/HttpOnly/i);
      expect(cookies[0]).toMatch(/SameSite=Lax/i);
    });

    it('13. should reject incorrect password with 401 Unauthorized', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'sarah@example.com',
          password: 'WrongPassword999!',
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid email or password');
    });

    it('14. should reject unknown email with generic 401 message (no email enumeration)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent.user@example.com',
          password: 'Password123!',
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid email or password');
    });

    it('15. should never return password or hash on login response', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'manager.admin@example.com',
          password: 'Password123!',
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.password).toBeUndefined();
    });

    it('should reject login for deactivated user', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'inactive@example.com',
          password: 'Password123!',
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.message).toMatch(/deactivated/i);
    });
  });

  // ==========================================
  // 3. Current User (/api/auth/me) & Logout Tests
  // ==========================================
  describe('GET /api/auth/me & POST /api/auth/logout', () => {
    let memberCookie;

    beforeAll(async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'sarah@example.com',
          password: 'Password123!',
        });
      memberCookie = loginRes.headers['set-cookie'];
    });

    it('16. should allow authenticated user to call /api/auth/me with cookie', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Cookie', memberCookie);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe('sarah@example.com');
      expect(res.body.data.role).toBe('TEAM_MEMBER');
      expect(res.body.data.password).toBeUndefined();
    });

    it('17. should reject unauthenticated call to /api/auth/me with 401', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('18. should reject invalid JWT token with 401 Unauthorized', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Cookie', ['auth_token=invalid.tampered.token']);

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('19. should reject access if user is deactivated after token was issued', async () => {
      await User.updateOne({ email: 'sarah@example.com' }, { isActive: false });

      const res = await request(app)
        .get('/api/auth/me')
        .set('Cookie', memberCookie);

      expect(res.statusCode).toBe(401);
      expect(res.body.message).toMatch(/deactivated/i);

      // Restore active state
      await User.updateOne({ email: 'sarah@example.com' }, { isActive: true });
    });

    it('20. should clear authentication cookie upon logout', async () => {
      const res = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', memberCookie);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies[0]).toMatch(/auth_token=;/); // Cleared cookie
    });
  });

  // ==========================================
  // 4. Role-Based Access Control (RBAC) Tests
  // ==========================================
  describe('RBAC Verification', () => {
    let memberCookie;
    let managerAdminCookie;

    beforeAll(async () => {
      const memberLogin = await request(app)
        .post('/api/auth/login')
        .send({ email: 'sarah@example.com', password: 'Password123!' });
      memberCookie = memberLogin.headers['set-cookie'];

      const managerAdminLogin = await request(app)
        .post('/api/auth/login')
        .send({ email: 'manager.admin@example.com', password: 'Password123!' });
      managerAdminCookie = managerAdminLogin.headers['set-cookie'];
    });

    it('21. should recognize TEAM_MEMBER on member-accessible route', async () => {
      const res = await request(app)
        .get('/api/auth/test-member')
        .set('Cookie', memberCookie);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.role).toBe('TEAM_MEMBER');
    });

    it('22. should recognize MANAGER_ADMIN on member-accessible route', async () => {
      const res = await request(app)
        .get('/api/auth/test-member')
        .set('Cookie', managerAdminCookie);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.role).toBe('MANAGER_ADMIN');
    });

    it('23. should reject TEAM_MEMBER from MANAGER_ADMIN-only route with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/auth/test-manager-admin')
        .set('Cookie', memberCookie);

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Access denied/i);
    });

    it('24. should allow MANAGER_ADMIN on MANAGER_ADMIN-only route with 200 OK', async () => {
      const res = await request(app)
        .get('/api/auth/test-manager-admin')
        .set('Cookie', managerAdminCookie);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.role).toBe('MANAGER_ADMIN');
    });

    it('25. should throw an error if authorizeRoles is configured with invalid role ADMIN', () => {
      expect(() => {
        authorizeRoles('ADMIN');
      }).toThrow(/Invalid role configuration/i);
    });

    it('26. should throw an error if authorizeRoles is configured with invalid role MANAGER', () => {
      expect(() => {
        authorizeRoles('MANAGER');
      }).toThrow(/Invalid role configuration/i);
    });
  });
});
