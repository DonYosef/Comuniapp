import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { CreateUserUseCase } from './create-user.use-case';
import { UserRepository } from '../../domain/repositories/user.repository.interface';
import { User, UserStatus } from '../../domain/entities/user.entity';
import { CreateUserDto } from '../dto/create-user.dto';

describe('CreateUserUseCase', () => {
  let useCase: CreateUserUseCase;
  let userRepository: jest.Mocked<UserRepository>;

  beforeEach(async () => {
    const mockUserRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findByStatus: jest.fn(),
      existsByEmail: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateUserUseCase,
        {
          provide: 'UserRepository',
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    useCase = module.get<CreateUserUseCase>(CreateUserUseCase);
    userRepository = module.get('UserRepository');
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should create a user successfully', async () => {
    // Arrange
    const createUserDto: CreateUserDto = {
      email: 'test@example.com',
      name: 'Test User',
      password: 'password123',
      status: UserStatus.ACTIVE,
    };

    const expectedUser = User.create(
      createUserDto.email,
      createUserDto.name,
      'hashedPassword',
      createUserDto.status,
    );

    userRepository.findByEmail.mockResolvedValue(null);
    userRepository.create.mockResolvedValue(expectedUser);

    // Act
    const result = await useCase.execute(createUserDto);

    // Assert
    expect(result).toBeDefined();
    expect(result.email).toBe(createUserDto.email);
    expect(result.name).toBe(createUserDto.name);
    expect(result.status).toBe(createUserDto.status);
    expect(userRepository.findByEmail).toHaveBeenCalledWith(createUserDto.email);
    expect(userRepository.create).toHaveBeenCalled();
  });

  it('should throw ConflictException when user already exists', async () => {
    // Arrange
    const createUserDto: CreateUserDto = {
      email: 'existing@example.com',
      name: 'Existing User',
      password: 'password123',
    };

    const existingUser = User.create(
      createUserDto.email,
      createUserDto.name,
      'hashedPassword',
      UserStatus.ACTIVE,
    );

    userRepository.findByEmail.mockResolvedValue(existingUser);

    // Act & Assert
    await expect(useCase.execute(createUserDto)).rejects.toThrow(ConflictException);
    expect(userRepository.findByEmail).toHaveBeenCalledWith(createUserDto.email);
    expect(userRepository.create).not.toHaveBeenCalled();
  });
});
