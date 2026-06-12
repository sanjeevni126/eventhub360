const assetService = require('../services/assetService');
const assetRepository = require('../repositories/assetRepository');
const { BadRequestError, NotFoundError } = require('../utils/errors');
const { pool } = require('../config/db');
const { sendEmail } = require('../utils/email');

jest.mock('../repositories/assetRepository');
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

describe('AssetService Unit Tests', () => {
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

  describe('getAllAssets', () => {
    it('should call assetRepository.findAll with mapped parameters', async () => {
      assetRepository.findAll.mockResolvedValue({ data: [], total: 0 });
      const result = await assetService.getAllAssets({ limit: 10, offset: 0, status: 'Available' });
      expect(assetRepository.findAll).toHaveBeenCalledWith({
        limit: 10,
        offset: 0,
        status: 'Available',
        search: undefined,
        category: undefined,
        assigned_employee: undefined
      });
      expect(result).toEqual({ data: [], total: 0 });
    });
  });

  describe('getAssetById', () => {
    it('should retrieve asset by id', async () => {
      assetRepository.findById.mockResolvedValue({ id: 1, asset_code: 'LAP-001' });
      const result = await assetService.getAssetById(1);
      expect(assetRepository.findById).toHaveBeenCalledWith(1);
      expect(result).toEqual({ id: 1, asset_code: 'LAP-001' });
    });

    it('should throw NotFoundError if asset does not exist', async () => {
      assetRepository.findById.mockResolvedValue(null);
      await expect(assetService.getAssetById(999)).rejects.toThrow(NotFoundError);
    });
  });

  describe('createAsset', () => {
    it('should successfully create asset and log audit details', async () => {
      mockClient.query.mockResolvedValueOnce({ rows: [] }); // BEGIN
      assetRepository.create.mockResolvedValue({ id: 2, asset_code: 'LAP-002' });
      const result = await assetService.createAsset({ asset_code: 'LAP-002' }, { id: 1 });
      expect(assetRepository.create).toHaveBeenCalledWith({ asset_code: 'LAP-002' }, mockClient);
      expect(assetRepository.addHistory).toHaveBeenCalledWith(2, 'Created', 'Asset registered into system', 1, mockClient);
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(mockClient.release).toHaveBeenCalled();
      expect(result).toEqual({ id: 2, asset_code: 'LAP-002' });
    });
  });

  describe('allocateAsset', () => {
    it('should successfully allocate an available asset', async () => {
      assetRepository.findById.mockResolvedValue({
        id: 1,
        asset_code: 'LAP-001',
        asset_name: 'Dell XPS 15',
        asset_type: 'Laptop',
        status: 'Available'
      });
      mockClient.query.mockResolvedValueOnce({ rows: [] }); // BEGIN
      mockClient.query.mockResolvedValueOnce({
        rows: [{ name: 'Amit Patel', email: 'amit@example.com' }]
      }); // SELECT employee user details
      assetRepository.allocate.mockResolvedValue({ id: 50, asset_id: 1, employee_id: 4 });

      const result = await assetService.allocateAsset(1, 4, { id: 1 });

      expect(assetRepository.findById).toHaveBeenCalledWith(1, mockClient);
      expect(assetRepository.allocate).toHaveBeenCalledWith(1, 4, 1, mockClient);
      expect(assetRepository.updateStatus).toHaveBeenCalledWith(1, 'Allocated', mockClient);
      expect(assetRepository.addHistory).toHaveBeenCalled();
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(mockClient.release).toHaveBeenCalled();
      expect(sendEmail).toHaveBeenCalled();
      expect(result.id).toBe(50);
    });

    it('should throw BadRequestError if asset status is not Available', async () => {
      assetRepository.findById.mockResolvedValue({
        id: 1,
        asset_code: 'LAP-001',
        asset_name: 'Dell XPS 15',
        status: 'Allocated' // Not Available
      });

      await expect(
        assetService.allocateAsset(1, 4, { id: 1 })
      ).rejects.toThrow(BadRequestError);

      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should throw NotFoundError if asset is not found', async () => {
      assetRepository.findById.mockResolvedValue(null);

      await expect(
        assetService.allocateAsset(999, 4, { id: 1 })
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('returnAsset', () => {
    it('should return asset successfully and set it to Available', async () => {
      mockClient.query.mockResolvedValueOnce({ rows: [] }); // BEGIN
      mockClient.query.mockResolvedValueOnce({
        rows: [{ id: 50, asset_id: 1, employee_id: 4, status: 'Active' }]
      }); // SELECT active allocation
      assetRepository.returnAssetByAssetId.mockResolvedValue({ id: 50, status: 'Returned' });

      const result = await assetService.returnAsset(1, { id: 1 });

      expect(assetRepository.returnAssetByAssetId).toHaveBeenCalledWith(1, mockClient);
      expect(assetRepository.updateStatus).toHaveBeenCalledWith(1, 'Available', mockClient);
      expect(assetRepository.addHistory).toHaveBeenCalledWith(1, 'Returned', 'Asset returned to inventory', 1, mockClient);
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(mockClient.release).toHaveBeenCalled();
      expect(result.status).toBe('Returned');
    });

    it('should throw BadRequestError if asset is not currently allocated', async () => {
      mockClient.query.mockResolvedValueOnce({ rows: [] }); // BEGIN
      mockClient.query.mockResolvedValueOnce({ rows: [] }); // SELECT returns no active allocation

      await expect(
        assetService.returnAsset(1, { id: 1 })
      ).rejects.toThrow(BadRequestError);

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(mockClient.release).toHaveBeenCalled();
    });
  });
});
