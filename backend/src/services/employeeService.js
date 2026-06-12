const { pool } = require('../config/db');
const employeeRepository = require('../repositories/employeeRepository');
const { NotFoundError, BadRequestError } = require('../utils/errors');
const logger = require('../utils/logger');

class EmployeeService {
  async getAllEmployees({ page, limit, search, department }) {
    const data = await employeeRepository.findAll({ page, limit, search, department });
    const total = await employeeRepository.countAll({ search, department });
    return { data, total };
  }

  async getEmployeeById(id) {
    const employee = await employeeRepository.findById(id);
    if (!employee) {
      throw new NotFoundError('Employee not found');
    }
    
    if (employee.profile_id) {
      const skills = await employeeRepository.findSkillsByProfileId(employee.profile_id);
      employee.skills = skills.map(s => s.id);
    } else {
      employee.skills = [];
    }

    return employee;
  }

  async createEmployee(employeeData, currentUser) {
    const { name, email, phone, department, skills } = employeeData;
    const bcrypt = require('bcryptjs');
    const defaultPassword = '123456';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Check if user already exists
      const userCheck = await client.query('SELECT * FROM users WHERE email = $1', [email]);
      if (userCheck.rows.length > 0) {
        throw new BadRequestError('User already exists');
      }

      // 1. Create User
      const userRes = await client.query(
        `INSERT INTO users (name, email, password, role) 
         VALUES ($1, $2, $3, 'employee') RETURNING id, name, email, role`,
        [name, email, hashedPassword]
      );
      const userId = userRes.rows[0].id;

      // 2. Find or Create Department
      let departmentId = null;
      if (department && department.trim()) {
        const deptRes = await client.query(
          'SELECT id FROM departments WHERE department_name ILIKE $1',
          [department.trim()]
        );
        if (deptRes.rows.length > 0) {
          departmentId = deptRes.rows[0].id;
        } else {
          const newDeptRes = await client.query(
            'INSERT INTO departments (department_name) VALUES ($1) RETURNING id',
            [department.trim()]
          );
          departmentId = newDeptRes.rows[0].id;
        }
      }

      // 3. Create Employee Profile
      const profileRes = await client.query(
        `INSERT INTO employee_profiles (user_id, department_id, phone, address, designation, salary) 
         VALUES ($1, $2, $3, '', '', 0) RETURNING id`,
        [userId, departmentId, phone || '']
      );
      const profileId = profileRes.rows[0].id;

      // 4. Resolve and Add Skills
      if (skills && skills.trim()) {
        const skillNames = skills
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
        for (const skillName of skillNames) {
          let skillRes = await client.query(
            'SELECT id FROM skills WHERE skill_name ILIKE $1',
            [skillName]
          );
          let skillId;
          if (skillRes.rows.length > 0) {
            skillId = skillRes.rows[0].id;
          } else {
            const newSkillRes = await client.query(
              'INSERT INTO skills (skill_name) VALUES ($1) RETURNING id',
              [skillName]
            );
            skillId = newSkillRes.rows[0].id;
          }
          await client.query(
            'INSERT INTO employee_skills (employee_id, skill_id) VALUES ($1, $2)',
            [profileId, skillId]
          );
        }
      }

      // 5. Create Notification
      const notificationMessage = `Added new employee ${name}`;
      await client.query(
        `INSERT INTO notifications (user_id, title, message) VALUES (NULL, 'New Employee Added', $1)`,
        [notificationMessage]
      );

      // 6. Create Audit Log
      const auditDetails = { name, email, role: 'employee', department, phone };
      await client.query(
        `INSERT INTO audit_logs (table_name, action_type, record_id, performed_by, new_data) 
         VALUES ('Employee', 'Create', $1, $2, $3)`,
        [userId, currentUser.id, JSON.stringify(auditDetails)]
      );

      await client.query('COMMIT');
      logger.info(`New Employee ID ${userId} added successfully by Admin/HR User ID ${currentUser.id}`);
      return userRes.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error(`Error in createEmployee transaction: ${error.message}`);
      throw error;
    } finally {
      client.release();
    }
  }

  async updateEmployee(id, employeeData, currentUser) {
    const { name, email, role, phone, department_id, designation, salary, address, working_mode, skills } = employeeData;
    
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const existingEmployee = await employeeRepository.findById(id);
      if (!existingEmployee) {
        throw new NotFoundError('Employee not found');
      }

      // 1. Update Users Table
      await employeeRepository.updateUser(id, { name, email, role }, client);

      // 2. Update Employee Profiles Table
      const profile = await employeeRepository.updateProfile(id, { phone, department_id, designation, salary, address, working_mode }, client);
      const profileId = profile.id;

      // 3. Update Skills (Clear old, insert new)
      await employeeRepository.clearSkills(profileId, client);
      if (skills && skills.length > 0) {
        await employeeRepository.addSkills(profileId, skills, client);
      }

      // 4. Create Notification
      const notificationMessage = `Updated details for ${name}`;
      await client.query(
        `INSERT INTO notifications (user_id, title, message) VALUES (NULL, 'Updated Employee', $1)`,
        [notificationMessage]
      );

      // 5. Create Audit Log
      const auditDetails = { name, email, role, designation, department_id, phone };
      await client.query(
        `INSERT INTO audit_logs (table_name, action_type, record_id, performed_by, new_data) 
         VALUES ('Employee', 'Update', $1, $2, $3)`,
        [id, currentUser.id, JSON.stringify(auditDetails)]
      );

      await client.query('COMMIT');
      logger.info(`Employee ID ${id} details updated successfully by Admin/HR User ID ${currentUser.id}`);
      return { message: 'Updated successfully' };
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error(`Error in updateEmployee transaction: ${error.message}`);
      throw error;
    } finally {
      client.release();
    }
  }

  async deleteEmployee(id, currentUser) {
    const employee = await employeeRepository.findById(id);
    if (!employee) {
      throw new NotFoundError('Employee not found');
    }

    const deleted = await employeeRepository.deleteUser(id);
    
    await pool.query(
      `INSERT INTO audit_logs (table_name, action_type, record_id, performed_by, new_data) 
       VALUES ('Employee', 'Delete', $1, $2, $3)`,
      [id, currentUser.id, JSON.stringify(deleted)]
    );

    logger.info(`Employee ID ${id} deleted successfully by Admin/HR User ID ${currentUser.id}`);
    return { message: 'Deleted' };
  }
}

module.exports = new EmployeeService();
