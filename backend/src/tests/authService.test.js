const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authService = require('../services/authService');
const authRepository = require('../repositories/authRepository');
const { BadRequestError, UnauthorizedError } = require('../utils/errors');

jest.mock('../repositories/authRepository');

describe('AuthService Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('signup', () => {
    it('should successfully register a new user', async () => {
      authRepository.findByEmail.mockResolvedValue(null);
      authRepository.createUser.mockResolvedValue({
        id: 11,
        name: 'John Doe',
        email: 'john@example.com',
        role: 'employee'
      });
      authRepository.createProfile.mockResolvedValue({ id: 11, user_id: 11, designation: 'Developer' });

      const result = await authService.signup({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        role: 'employee',
        designation: 'Developer'
      });

      expect(authRepository.findByEmail).toHaveBeenCalledWith('john@example.com');
      expect(authRepository.createUser).toHaveBeenCalled();
      expect(result).toHaveProperty('token');
      expect(result.user.name).toBe('John Doe');
    });

    it('should throw BadRequestError if user already exists', async () => {
      authRepository.findByEmail.mockResolvedValue({ id: 1, email: 'john@example.com' });

      await expect(
        authService.signup({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'password123'
        })
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe('login', () => {
    it('should login successfully with valid credentials and plain password', async () => {
      authRepository.findByEmail.mockResolvedValue({
        id: 4,
        name: 'Amit Patel',
        email: 'amit@example.com',
        password: 'plainpassword',
        role: 'employee',
        designation: 'React Developer'
      });

      const result = await authService.login({
        email: 'amit@example.com',
        password: 'plainpassword',
        role: 'employee'
      });

      expect(result).toHaveProperty('token');
      expect(result.user.name).toBe('Amit Patel');
    });

    it('should login successfully with valid credentials and bcrypt hash', async () => {
      const hashedPassword = await bcrypt.hash('secretpass', 10);
      authRepository.findByEmail.mockResolvedValue({
        id: 4,
        name: 'Amit Patel',
        email: 'amit@example.com',
        password: hashedPassword,
        role: 'employee',
        designation: 'React Developer'
      });

      const result = await authService.login({
        email: 'amit@example.com',
        password: 'secretpass',
        role: 'employee'
      });

      expect(result).toHaveProperty('token');
      expect(result.user.email).toBe('amit@example.com');
    });

    it('should throw BadRequestError if user is not found', async () => {
      authRepository.findByEmail.mockResolvedValue(null);

      await expect(
        authService.login({
          email: 'none@example.com',
          password: 'password',
          role: 'employee'
        })
      ).rejects.toThrow(BadRequestError);
    });

    it('should throw UnauthorizedError if role does not match', async () => {
      authRepository.findByEmail.mockResolvedValue({
        id: 4,
        name: 'Amit Patel',
        email: 'amit@example.com',
        password: 'password',
        role: 'employee'
      });

      await expect(
        authService.login({
          email: 'amit@example.com',
          password: 'password',
          role: 'admin'
        })
      ).rejects.toThrow(UnauthorizedError);
    });

    it('should throw BadRequestError if password does not match', async () => {
      authRepository.findByEmail.mockResolvedValue({
        id: 4,
        name: 'Amit Patel',
        email: 'amit@example.com',
        password: 'hashedorplainpassword',
        role: 'employee'
      });

      await expect(
        authService.login({
          email: 'amit@example.com',
          password: 'wrongpassword',
          role: 'employee'
        })
      ).rejects.toThrow(BadRequestError);
    });
  });
});
