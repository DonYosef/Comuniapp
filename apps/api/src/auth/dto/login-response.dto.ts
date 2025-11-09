import { ApiProperty } from '@nestjs/swagger';

export class CommunityDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  address: string;

  @ApiProperty()
  status: string;
}

export class UserRoleDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ type: [String] })
  permissions: string[];
}

export class UserUnitDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  unit: {
    id: string;
    number: string;
    floor: string | null;
    community: {
      id: string;
      name: string;
      address: string;
    };
  };
}

export class UserDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  organizationId: string | null;

  @ApiProperty({ required: false })
  phone: string | null;

  @ApiProperty({ type: [UserRoleDto] })
  roles: UserRoleDto[];

  @ApiProperty({ type: [CommunityDto] })
  communities: CommunityDto[];

  @ApiProperty({ type: [UserUnitDto] })
  userUnits: UserUnitDto[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class LoginResponseDto {
  @ApiProperty({ type: UserDto })
  user: UserDto;

  @ApiProperty()
  accessToken: string;

  @ApiProperty({ required: false })
  organizationId?: string;
}
