const Joi = require('joi');

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(4).required(),
  role: Joi.string().valid('admin', 'manager', 'hr', 'employee').insensitive().required()
});

const signupSchema = Joi.object({
  name: Joi.string().min(2).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(4).required(),
  role: Joi.string().valid('admin', 'manager', 'hr', 'employee').insensitive().default('employee'),
  designation: Joi.string().allow('', null)
});

const employeeSchema = Joi.object({
  name: Joi.string().min(2).required(),
  email: Joi.string().email().required(),
  role: Joi.string().valid('admin', 'manager', 'hr', 'employee').insensitive().required(),
  phone: Joi.string().allow('', null),
  department_id: Joi.number().integer().allow(null),
  designation: Joi.string().allow('', null),
  salary: Joi.number().integer().min(0).allow(null),
  address: Joi.string().allow('', null),
  working_mode: Joi.string().valid('Onsite', 'Hybrid', 'Remote').allow('', null),
  skills: Joi.array().items(Joi.number().integer()).allow(null)
});

const leaveSchema = Joi.object({
  leave_type_id: Joi.number().integer().required(),
  from_date: Joi.date().iso().required(),
  to_date: Joi.date().iso().required(),
  reason: Joi.string().allow('', null)
});

const assetSchema = Joi.object({
  asset_code: Joi.string().required(),
  asset_name: Joi.string().required(),
  asset_type: Joi.string().required(),
  purchase_date: Joi.date().iso().allow(null),
  purchase_cost: Joi.number().min(0).allow(null)
});

const createEmployeeSchema = Joi.object({
  name: Joi.string().min(2).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().allow('', null),
  department: Joi.string().allow('', null),
  skills: Joi.string().allow('', null),
  profile_image_url: Joi.string().allow('', null)
});

module.exports = {
  loginSchema,
  signupSchema,
  employeeSchema,
  leaveSchema,
  assetSchema,
  createEmployeeSchema
};
