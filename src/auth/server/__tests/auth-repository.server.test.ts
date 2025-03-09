import { beforeEach, describe, expect, it, vi } from 'vitest';

import { resolveDatabase } from '../../../common/services/database';
import { users } from '../../config/db/schema';
import { hashPassword } from '../../utils';
import { AuthError } from '../../utils';
import { authRepository } from '../auth-repository.server';

vi.mock('../../../database/services/database.server');
vi.mock('../../auth-hash', () => ({
  comparePassword: vi.fn(),
  hashPassword: vi.fn(),
}));

const mockContext = {};
const mockDb = { select: vi.fn(), insert: vi.fn(), delete: vi.fn(), update: vi.fn() };
const TEST_CREDENTIALS = { email: 'test@example.com', password: 'testPassword' };
const SUCCESS_USER = { id: '123', email: 'test@example.com', emailVerified: false };

describe('authRepository.findOrCreate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (resolveDatabase as jest.Mock).mockReturnValue(mockDb);

    // Set up default mock implementations for method chaining
    mockDb.select.mockReturnValue({ from: vi.fn().mockReturnValue({ where: vi.fn().mockReturnValue({ limit: vi.fn().mockReturnValue([]) }) }) });
    mockDb.insert.mockReturnValue({ values: vi.fn().mockReturnValue({ returning: vi.fn().mockReturnValue([]) }) });
  });

  it('should create a new user when none exists', async () => {
    // Mock user not found
    mockDb.select.mockReturnValue({ from: vi.fn().mockReturnValue({ where: vi.fn().mockReturnValue({ limit: vi.fn().mockReturnValue([]) }) }) });

    // Mock successful user creation
    const userInsertMock = { values: vi.fn().mockReturnValue({ returning: vi.fn().mockReturnValue([SUCCESS_USER]) }) };
    const passwordInsertMock = { values: vi.fn().mockReturnValue({ returning: vi.fn().mockReturnValue([{ id: '1' }]) }) };

    mockDb.insert
      .mockReturnValueOnce(userInsertMock) // First insert (users)
      .mockReturnValueOnce(passwordInsertMock); // Second insert (passwords)

    // Act
    const [error, user] = await authRepository.findOrCreate(mockContext, TEST_CREDENTIALS);

    expect(error).toBeNull();
    expect(user).toEqual(SUCCESS_USER);
    expect(mockDb.insert).toHaveBeenCalledTimes(2);
    expect(userInsertMock.values).toHaveBeenCalledWith({ email: TEST_CREDENTIALS.email });
  });

  it('should return existing user when canExist is true', async () => {
    // Mock user found
    mockDb.select.mockReturnValue({ from: vi.fn().mockReturnValue({ where: vi.fn().mockReturnValue({ limit: vi.fn().mockReturnValue([SUCCESS_USER]) }) }) });

    // Act
    const [error, user] = await authRepository.findOrCreate(mockContext, TEST_CREDENTIALS, true);

    expect(error).toBeNull();
    expect(user).toEqual(SUCCESS_USER);
    expect(mockDb.insert).not.toHaveBeenCalled();
  });

  it('should return an error when user already exists and canExist is false', async () => {
    // Mock user found
    mockDb.select.mockReturnValue({ from: vi.fn().mockReturnValue({ where: vi.fn().mockReturnValue({ limit: vi.fn().mockReturnValue([SUCCESS_USER]) }) }) });

    // Act
    const [error, user] = await authRepository.findOrCreate(mockContext, TEST_CREDENTIALS, false);

    expect(error).toBeInstanceOf(AuthError);
    expect(error?.message).toBe(`User with ${TEST_CREDENTIALS.email} exists.`);
    expect(user).toBeUndefined();
    expect(mockDb.insert).not.toHaveBeenCalled();
  });

  it('should return an error when user creation fails', async () => {
    // Mock user not found
    mockDb.select.mockReturnValue({ from: vi.fn().mockReturnValue({ where: vi.fn().mockReturnValue({ limit: vi.fn().mockReturnValue([]) }) }) });

    // Mock user creation failed insert
    const failedInsertMock = { values: vi.fn().mockReturnValue({ returning: vi.fn().mockReturnValue([]) }) };
    mockDb.insert.mockReturnValue(failedInsertMock);

    // Act
    const [error, user] = await authRepository.findOrCreate(mockContext, TEST_CREDENTIALS);

    expect(error).toBeInstanceOf(AuthError);
    expect(error?.kind).toBe('DB USER CREATE FAILED');
    expect(error?.message).toBe('User create failed');
    expect(user).toBeUndefined();
  });

  it('should handle database errors during creation', async () => {
    // Mock user not found
    mockDb.select.mockReturnValue({ from: vi.fn().mockReturnValue({ where: vi.fn().mockReturnValue({ limit: vi.fn().mockReturnValue([]) }) }) });

    // Mock database error
    const errorInsertMock = {
      values: vi.fn().mockImplementation(() => {
        throw new Error('Database error');
      }),
    };
    mockDb.insert.mockReturnValue(errorInsertMock);

    // Act
    const [error, user] = await authRepository.findOrCreate(mockContext, TEST_CREDENTIALS);

    expect(error).toBeInstanceOf(AuthError);
    expect(error?.kind).toBe('DB USER CREATE FAILED');
    expect(error?.message).toBe('Database error');
    expect(user).toBeUndefined();
  });
});

describe('authRepository.findOrCreateHashed', () => {
  const HASHED_PASSWORD = 'hashedTestPassword';

  beforeEach(() => {
    vi.clearAllMocks();
    (resolveDatabase as jest.Mock).mockReturnValue(mockDb);
    (hashPassword as jest.Mock).mockResolvedValue(HASHED_PASSWORD);

    // Set up default mock implementations
    mockDb.select.mockReturnValue({ from: vi.fn().mockReturnValue({ where: vi.fn().mockReturnValue({ limit: vi.fn().mockReturnValue([]) }) }) });
    mockDb.insert.mockReturnValue({ values: vi.fn().mockReturnValue({ returning: vi.fn().mockReturnValue([]) }) });
  });

  it('should create a new user with hashed password', async () => {
    // Mock user not found
    mockDb.select.mockReturnValue({ from: vi.fn().mockReturnValue({ where: vi.fn().mockReturnValue({ limit: vi.fn().mockReturnValue([]) }) }) });

    // Mock successful user and password creation
    const userInsertMock = { values: vi.fn().mockReturnValue({ returning: vi.fn().mockReturnValue([SUCCESS_USER]) }) };
    const passwordInsertMock = { values: vi.fn().mockReturnValue({ returning: vi.fn().mockReturnValue([{ id: '1' }]) }) };

    mockDb.insert.mockReturnValueOnce(userInsertMock).mockReturnValueOnce(passwordInsertMock);

    // Act
    const [error, user] = await authRepository.findOrCreateHashed(mockContext, TEST_CREDENTIALS);

    expect(error).toBeNull();
    expect(user).toEqual(SUCCESS_USER);
    expect(hashPassword).toHaveBeenCalledWith(TEST_CREDENTIALS.password);
    expect(userInsertMock.values).toHaveBeenCalledWith({ email: TEST_CREDENTIALS.email });
    expect(passwordInsertMock.values).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: SUCCESS_USER.id,
        password: HASHED_PASSWORD,
      })
    );
  });

  it('should return an error when user exists and canExist is false', async () => {
    mockDb.select.mockReturnValue({ from: vi.fn().mockReturnValue({ where: vi.fn().mockReturnValue({ limit: vi.fn().mockReturnValue([SUCCESS_USER]) }) }) });

    // Act
    const [error, user] = await authRepository.findOrCreateHashed(mockContext, TEST_CREDENTIALS);

    expect(error).toBeInstanceOf(AuthError);
    expect(error?.message).toBe(`User with ${TEST_CREDENTIALS.email} exists.`);
    expect(user).toBeUndefined();
    expect(mockDb.insert).not.toHaveBeenCalled();
  });

  it('should return existing user when canExist is true', async () => {
    mockDb.select.mockReturnValue({ from: vi.fn().mockReturnValue({ where: vi.fn().mockReturnValue({ limit: vi.fn().mockReturnValue([SUCCESS_USER]) }) }) });

    const [error, user] = await authRepository.findOrCreateHashed(mockContext, TEST_CREDENTIALS, true);

    expect(error).toBeNull();
    expect(user).toEqual(SUCCESS_USER);
    expect(mockDb.insert).not.toHaveBeenCalled();
  });

  it('should handle database errors during user creation', async () => {
    mockDb.select.mockReturnValue({ from: vi.fn().mockReturnValue({ where: vi.fn().mockReturnValue({ limit: vi.fn().mockReturnValue([]) }) }) });

    const errorInsertMock = {
      values: vi.fn().mockImplementation(() => {
        throw new Error('Database error');
      }),
    };
    mockDb.insert.mockReturnValue(errorInsertMock);

    // Act
    const [error, user] = await authRepository.findOrCreateHashed(mockContext, TEST_CREDENTIALS);

    expect(error).toBeInstanceOf(AuthError);
    expect(error?.kind).toBe('DB USER CREATE FAILED');
    expect(error?.message).toBe('Database error');
    expect(user).toBeUndefined();
  });
});

describe('authRepository.findOneEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (resolveDatabase as jest.Mock).mockReturnValue(mockDb);
    mockDb.select.mockReturnValue({ from: vi.fn().mockReturnValue({ where: vi.fn().mockReturnValue({ limit: vi.fn().mockReturnValue([]) }) }) });
  });

  it('should find an existing user by email', async () => {
    // Mock user found
    mockDb.select.mockReturnValue({ from: vi.fn().mockReturnValue({ where: vi.fn().mockReturnValue({ limit: vi.fn().mockReturnValue([SUCCESS_USER]) }) }) });

    // Act
    const [error, user] = await authRepository.findOneEmail(mockContext, TEST_CREDENTIALS.email);

    expect(error).toBeNull();
    expect(user).toEqual(SUCCESS_USER);
    expect(mockDb.select).toHaveBeenCalledWith({
      id: users.id,
      email: users.email,
      emailVerified: users.emailVerified,
    });
  });

  it('should return undefined and AuthError when user is not found', async () => {
    // Mock user not found
    mockDb.select.mockReturnValue({ from: vi.fn().mockReturnValue({ where: vi.fn().mockReturnValue({ limit: vi.fn().mockReturnValue([]) }) }) });

    const [error, user] = await authRepository.findOneEmail(mockContext, TEST_CREDENTIALS.email);

    console.log(error);

    expect(error).toBeInstanceOf(AuthError);
    expect(user).toBeUndefined();
    expect(mockDb.select).toHaveBeenCalled();
  });

  it('should return undefined and AuthError on database errors', async () => {
    // Mock user not found
    mockDb.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockImplementation(() => {
            throw new Error('Database error');
          }),
        }),
      }),
    });

    const [error, user] = await authRepository.findOneEmail(mockContext, TEST_CREDENTIALS.email);

    console.log(error);

    expect(error).toBeInstanceOf(AuthError);
    expect(user).toBeUndefined();
    expect(mockDb.select).toHaveBeenCalled();
  });
});
