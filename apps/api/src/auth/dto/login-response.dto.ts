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

export class UserDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  organizationId: string | null;

  @ApiProperty({ type: [UserRoleDto], required: false })
  roles?: UserRoleDto[];

  @ApiProperty({ type: [CommunityDto], required: false })
  communities?: CommunityDto[];

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
