const leaveService = require('../services/leaveService');
const leaveRepository = require('../repositories/leaveRepository');
const { BadRequestError, NotFoundError } = require('../utils/errors');
const { pool } = require('../config/db');
const { sendEmail } = require('../utils/email');

jest.mock('../repositories/leaveRepository');
jest.mock('../utils/email');
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

describe('LeaveService Unit Tests', () => {
  let mockClient;

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = {
      query: jest.fn(),
      release: jest.fn()
    };
    pool.connect.mockResolvedValue(mockClient);
    sendEmail.mockResolvedValue({ messageId: '123' });
  });

  describe('getAllLeaves', () => {
    it('should call leaveRepository.findAll', async () => {
      leaveRepository.findAll.mockResolvedValue([]);
      const result = await leaveService.getAllLeaves({ status: 'Pending' });
      expect(leaveRepository.findAll).toHaveBeenCalledWith({ status: 'Pending' });
      expect(result).toEqual([]);
    });
  });

  describe('getLeaveTypes', () => {
    it('should call leaveRepository.findTypes', async () => {
      leaveRepository.findTypes.mockResolvedValue([{ id: 1, leave_name: 'Sick Leave' }]);
      const result = await leaveService.getLeaveTypes();
      expect(leaveRepository.findTypes).toHaveBeenCalled();
      expect(result).toEqual([{ id: 1, leave_name: 'Sick Leave' }]);
    });
  });

  describe('getLeaveBalances', () => {
    it('should parse and format raw balance rows', async () => {
      const mockBalances = [
        { id: 4, employee_name: 'Amit Patel', leave_name: 'Casual Leave', available_days: 10 },
        { id: 4, employee_name: 'Amit Patel', leave_name: 'Sick Leave', available_days: 8 }
      ];
      leaveRepository.findBalances.mockResolvedValue(mockBalances);
      const result = await leaveService.getLeaveBalances();
      expect(leaveRepository.findBalances).toHaveBeenCalled();
      expect(result[0]).toEqual({
        id: 4,
        employee: 'Amit Patel',
        Casual: 10,
        Sick: 8,
        Earned: 'N/A',
        Maternity: 'N/A'
      });
    });
  });

  describe('applyLeave', () => {
    it('should successfully submit a leave request', async () => {
      leaveRepository.findBalanceForEmployee.mockResolvedValue(10);
      leaveRepository.createApplication.mockResolvedValue({
        id: 101,
        employee_id: 4,
        leave_type_id: 1,
        from_date: '2026-06-15',
        to_date: '2026-06-17',
        total_days: 3,
        status: 'Pending'
      });
      leaveRepository.getLeaveTypeName.mockResolvedValue('Casual Leave');

      const result = await leaveService.applyLeave({
        employeeId: 4,
        leaveTypeId: 1,
        fromDate: '2026-06-15',
        toDate: '2026-06-17',
        reason: 'Holiday',
        employeeName: 'Amit Patel'
      });

      expect(leaveRepository.findBalanceForEmployee).toHaveBeenCalledWith(4, 1, mockClient);
      expect(leaveRepository.createApplication).toHaveBeenCalled();
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(mockClient.release).toHaveBeenCalled();
      expect(result.id).toBe(101);
    });

    it('should throw BadRequestError if requesting more than available balance', async () => {
      leaveRepository.findBalanceForEmployee.mockResolvedValue(2); // Only 2 days left

      await expect(
        leaveService.applyLeave({
          employeeId: 4,
          leaveTypeId: 1,
          fromDate: '2026-06-15',
          toDate: '2026-06-18', // 4 days
          reason: 'Holiday',
          employeeName: 'Amit'
        })
      ).rejects.toThrow(BadRequestError);

      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should throw BadRequestError if date values are invalid', async () => {
      await expect(
        leaveService.applyLeave({
          employeeId: 4,
          leaveTypeId: 1,
          fromDate: 'invalid-date',
          toDate: '2026-06-18'
        })
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe('updateLeaveStatus', () => {
    it('should approve leave and deduct balance inside a transaction', async () => {
      leaveRepository.findById.mockResolvedValue({
        id: 101,
        employee_id: 4,
        leave_type_id: 1,
        total_days: 3,
        status: 'Pending',
        leave_name: 'Casual Leave',
        employee_name: 'Amit Patel',
        employee_email: 'amit@example.com'
      });
      leaveRepository.findBalanceForEmployee.mockResolvedValue(10);

      const result = await leaveService.updateLeaveStatus(
        101,
        { status: 'Approved', remarks: 'Good to go' },
        { id: 1 } // currentUser
      );

      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(leaveRepository.findBalanceForEmployee).toHaveBeenCalledWith(4, 1, mockClient);
      expect(leaveRepository.updateBalance).toHaveBeenCalledWith(4, 1, 7, mockClient);
      expect(leaveRepository.updateStatus).toHaveBeenCalledWith(101, 'Approved', mockClient);
      expect(leaveRepository.addApprovalHistory).toHaveBeenCalled();
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(mockClient.release).toHaveBeenCalled();
      expect(sendEmail).toHaveBeenCalled();
      expect(result.id).toBe(101);
    });

    it('should reject leave without deducting balance', async () => {
      leaveRepository.findById.mockResolvedValue({
        id: 101,
        employee_id: 4,
        leave_type_id: 1,
        total_days: 3,
        status: 'Pending',
        leave_name: 'Casual Leave',
        employee_name: 'Amit Patel',
        employee_email: 'amit@example.com'
      });

      const result = await leaveService.updateLeaveStatus(
        101,
        { status: 'Rejected', remarks: 'No coverage' },
        { id: 1 }
      );

      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(leaveRepository.findBalanceForEmployee).not.toHaveBeenCalled();
      expect(leaveRepository.updateBalance).not.toHaveBeenCalled();
      expect(leaveRepository.updateStatus).toHaveBeenCalledWith(101, 'Rejected', mockClient);
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(result.id).toBe(101);
    });

    it('should throw BadRequestError if leave status is already updated', async () => {
      leaveRepository.findById.mockResolvedValue({
        id: 101,
        employee_id: 4,
        status: 'Approved' // Not Pending
      });

      await expect(
        leaveService.updateLeaveStatus(101, { status: 'Approved' }, { id: 1 })
      ).rejects.toThrow(BadRequestError);
    });
  });
});
