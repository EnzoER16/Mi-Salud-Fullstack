import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

import { MESSAGE_PATTERNS } from '@app/contracts';
import type {
  RegisterUserPayload,
  LoginUserPayload,
} from '@app/contracts';

import { UsersService } from './users.service';

@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @MessagePattern(MESSAGE_PATTERNS.IDENTITY_REGISTER)
  register(@Payload() data: RegisterUserPayload) {
    return this.usersService.register(data);
  }

  @MessagePattern(MESSAGE_PATTERNS.IDENTITY_LOGIN)
  login(@Payload() data: LoginUserPayload) {
    return this.usersService.validateCredentials(data);
  }

  @MessagePattern(MESSAGE_PATTERNS.IDENTITY_FIND_BY_ID)
  findById(@Payload() id: string) {
    return this.usersService.findById(id);
  }
}