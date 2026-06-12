const validationMiddleware = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false, allowUnknown: true });
    if (error) {
      const details = error.details.map(d => d.message).join(', ');
      return res.status(400).json({
        success: false,
        message: `Validation Error: ${details}`
      });
    }
    next();
  };
};

module.exports = validationMiddleware;
