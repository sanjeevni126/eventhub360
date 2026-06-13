const jwt = require('jsonwebtoken');
const { UnauthorizedError, ForbiddenError } = require('../utils/errors');
const logger = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_for_students';

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next(new UnauthorizedError('Access denied. No token provided.'));
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      logger.error('JWT Verification Error: ' + err.message, { stack: err.stack });
      return next(new ForbiddenError('Invalid token.'));
    }
    req.user = user;
    next();
  });
};

module.exports = { authenticateToken, JWT_SECRET };
