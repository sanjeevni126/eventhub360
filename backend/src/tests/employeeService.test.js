const employeeService = require('../services/employeeService');
const employeeRepository = require('../repositories/employeeRepository');
const { NotFoundError, BadRequestError } = require('../utils/errors');
const { pool } = require('../config/db');

jest.mock('../repositories/employeeRepository');
jest.mock('../config/db', () => {
  const mClient = {
    query: jest.fn(),
    release: jest.fn()
  };
  const mPool = {
    connect: jest.fn().mockResolvedValue(mClient),
    query: jest.fn()
  };
  return { pool: mPool };
});

describe('EmployeeService Unit Tests', () => {
  let mockClient;

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = {
      query: jest.fn(),
      release: jest.fn()
    };
    pool.connect.mockResolvedValue(mockClient);
  });

  describe('getAllEmployees', () => {
    it('should return paginated and filtered data and total count', async () => {
      const mockList = [{ id: 1, name: 'John Doe', email: 'john@example.com' }];
      employeeRepository.findAll.mockResolvedValue(mockList);
      employeeRepository.countAll.mockResolvedValue(1);

      const result = await employeeService.getAllEmployees({ page: 1, limit: 10 });

      expect(employeeRepository.findAll).toHaveBeenCalledWith({ page: 1, limit: 10 });
      expect(employeeRepository.countAll).toHaveBeenCalled();
      expect(result.data).toEqual(mockList);
      expect(result.total).toBe(1);
    });
  });

  describe('getEmployeeById', () => {
    it('should return employee details with skills array', async () => {
      employeeRepository.findById.mockResolvedValue({
        id: 4,
        name: 'Amit Patel',
        profile_id: 10
      });
      employeeRepository.findSkillsByProfileId.mockResolvedValue([
        { id: 1, skill_name: 'React' },
        { id: 4, skill_name: 'JavaScript' }
      ]);

      const result = await employeeService.getEmployeeById(4);

      expect(employeeRepository.findById).toHaveBeenCalledWith(4);
      expect(employeeRepository.findSkillsByProfileId).toHaveBeenCalledWith(10);
      expect(result.skills).toEqual([1, 4]);
    });

    it('should throw NotFoundError if employee not found', async () => {
      employeeRepository.findById.mockResolvedValue(null);

      await expect(employeeService.getEmployeeById(999)).rejects.toThrow(NotFoundError);
    });
  });

  describe('createEmployee', () => {
    it('should create employee successfully inside transaction', async () => {
      mockClient.query
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce({ rows: [] }) // User check
        .mockResolvedValueOnce({ rows: [{ id: 5, name: 'Amit New', email: 'amit@example.com', role: 'employee' }] }) // Create User
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // Find Department
        .mockResolvedValueOnce({ rows: [{ id: 10 }] }) // Create Profile
        .mockResolvedValueOnce({ rows: [{ id: 2 }] }) // Find Skill
        .mockResolvedValueOnce(undefined) // Add Skill
        .mockResolvedValueOnce(undefined) // Create Notification
        .mockResolvedValueOnce(undefined) // Create Audit Log
        .mockResolvedValueOnce(undefined); // COMMIT

      const result = await employeeService.createEmployee(
        {
          name: 'Amit New',
          email: 'amit@example.com',
          phone: '12345',
          department: 'Engineering',
          skills: 'React'
        },
        { id: 1 } // currentUser
      );

      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(mockClient.release).toHaveBeenCalled();
      expect(result.id).toBe(5);
    });

    it('should throw BadRequestError if user already exists', async () => {
      mockClient.query
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce({ rows: [{ id: 4 }] }); // User check: exists

      await expect(
        employeeService.createEmployee(
          { name: 'Amit New', email: 'amit@example.com' },
          { id: 1 }
        )
      ).rejects.toThrow(BadRequestError);

      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should rollback and throw error on db failure', async () => {
      mockClient.query
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockRejectedValueOnce(new Error('DB Query Error'));

      await expect(
        employeeService.createEmployee(
          { name: 'Amit New', email: 'amit@example.com' },
          { id: 1 }
        )
      ).rejects.toThrow('DB Query Error');

      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('updateEmployee', () => {
    it('should update employee data inside transaction', async () => {
      employeeRepository.findById.mockResolvedValue({ id: 4, name: 'Amit', profile_id: 10 });
      employeeRepository.updateUser.mockResolvedValue({ id: 4, name: 'Amit New', email: 'amit@example.com' });
      employeeRepository.updateProfile.mockResolvedValue({ id: 10 });

      const result = await employeeService.updateEmployee(
        4,
        {
          name: 'Amit New',
          email: 'amit@example.com',
          role: 'employee',
          phone: '12345',
          department_id: 1,
          designation: 'Sr. Dev',
          salary: 60000,
          address: 'Indore',
          skills: [1, 2]
        },
        { id: 1 } // currentUser
      );

      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(employeeRepository.updateUser).toHaveBeenCalled();
      expect(employeeRepository.updateProfile).toHaveBeenCalled();
      expect(employeeRepository.clearSkills).toHaveBeenCalled();
      expect(employeeRepository.addSkills).toHaveBeenCalledWith(10, [1, 2], mockClient);
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(mockClient.release).toHaveBeenCalled();
      expect(result.message).toBe('Updated successfully');
    });

    it('should rollback and throw error on failure', async () => {
      employeeRepository.findById.mockResolvedValue({ id: 4, name: 'Amit', profile_id: 10 });
      employeeRepository.updateUser.mockRejectedValue(new Error('DB Error'));

      await expect(
        employeeService.updateEmployee(4, { name: 'Amit New' }, { id: 1 })
      ).rejects.toThrow('DB Error');

      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('deleteEmployee', () => {
    it('should successfully delete an employee and log to audit logs', async () => {
      employeeRepository.findById.mockResolvedValue({ id: 4, name: 'Amit' });
      employeeRepository.deleteUser.mockResolvedValue({ id: 4, name: 'Amit' });

      const result = await employeeService.deleteEmployee(4, { id: 1 });

      expect(employeeRepository.findById).toHaveBeenCalledWith(4);
      expect(employeeRepository.deleteUser).toHaveBeenCalledWith(4);
      expect(pool.query).toHaveBeenCalled();
      expect(result.message).toBe('Deleted');
    });

    it('should throw NotFoundError if employee to delete does not exist', async () => {
      employeeRepository.findById.mockResolvedValue(null);

      await expect(employeeService.deleteEmployee(999, { id: 1 })).rejects.toThrow(NotFoundError);
    });
  });
});
