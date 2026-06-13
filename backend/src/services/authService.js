const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authRepository = require('../repositories/authRepository');
const { BadRequestError, UnauthorizedError } = require('../utils/errors');
const logger = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_for_students';

class AuthService {
  async signup({ name, email, password, role, designation }) {
    const existingUser = await authRepository.findByEmail(email);
    if (existingUser) {
      throw new BadRequestError('User already exists');
    }

    const assignedRole = role || 'employee';

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save user & profile
    const user = await authRepository.createUser(name, email, hashedPassword, assignedRole);
    await authRepository.createProfile(user.id, designation);

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '8h' });

    return { token, user: { ...user, designation } };
  }

  async login({ email, password, role }) {
    const user = await authRepository.findByEmail(email);
    if (!user) {
      logger.warn(`Authentication failure: No user found with email ${email}`);
      throw new BadRequestError('Invalid credentials');
    }

    if (role && user.role.toLowerCase() !== role.toLowerCase()) {
  logger.warn(`Authentication failure: Role mismatch for ${email}. Expected ${role}, got ${user.role}`);
  throw new UnauthorizedError(`Access denied. You are not registered as a ${role}`);
}

    // Support both plaintext and bcrypt hashes for migration safety
    let isMatch = false;
    if (user.password === password) {
      isMatch = true;
    } else {
      isMatch = await bcrypt.compare(password, user.password).catch(() => false);
    }

    if (!isMatch) {
      logger.warn(`Authentication failure: Password mismatch for ${email}`);
      throw new BadRequestError('Invalid credentials');
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '8h' });

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        designation: user.designation
      }
    };
  }

  async forgotPassword({ email }) {
    const user = await authRepository.findByEmail(email);
    if (!user) {
      throw new BadRequestError('User not found with this email');
    }

    const token = jwt.sign({ email: user.email, purpose: 'password-reset' }, JWT_SECRET, { expiresIn: '15m' });
    const resetLink = `http://localhost:5173/reset-password?token=${token}&email=${encodeURIComponent(user.email)}`;

    const { sendEmail } = require('../utils/email');
    await sendEmail({
      to: user.email,
      subject: 'HRMS Password Reset Link',
      text: `Hello ${user.name},\n\nThis email is to reset your password. Please click the link below to reset your password:\n${resetLink}\n\nThis reset link is valid for 15 minutes.\n\nBest regards,\nHRMS Admin Team`
    });

    return { message: 'Reset link sent successfully on your email' };
  }

  async resetPassword({ email, token, password }) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      if (decoded.email !== email || decoded.purpose !== 'password-reset') {
        throw new BadRequestError('Invalid reset token or email mismatch');
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      await authRepository.updatePassword(email, hashedPassword);

      return { message: 'Password reset successful. You can now login with your new password.' };
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        throw new BadRequestError('Reset link has expired. Please request a new one.');
      }
      throw new BadRequestError('Invalid or expired reset token');
    }
  }
}

module.exports = new AuthService();
