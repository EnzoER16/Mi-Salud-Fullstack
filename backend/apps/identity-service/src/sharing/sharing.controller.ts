import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { SharingService } from './sharing.service';
@Controller()
export class SharingController {
  constructor(private readonly sharing: SharingService) {}
  @MessagePattern('identity.workflows.execute')
  execute(@Payload() payload: {action:string;data:any}) {
    return this.sharing.execute(payload.action,payload.data);
  }
}
