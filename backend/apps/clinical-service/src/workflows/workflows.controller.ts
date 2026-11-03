import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { WorkflowsService } from './workflows.service';
@Controller()
export class WorkflowsController {
  constructor(private readonly workflows:WorkflowsService) {}
  @MessagePattern('clinical.workflows.execute')
  execute(@Payload() payload:{action:string;data:any}) {return this.workflows.execute(payload.action,payload.data);}
}
