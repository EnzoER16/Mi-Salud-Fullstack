import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { InternalClientsModule } from '../clients/clients.module';
import { WorkflowsGatewayService } from './workflows.service';
import { PatientFlowsController, DoctorFlowsController, TreatmentFlowsController,
  NotificationsFlowsController, CareFlowsController, AppointmentExtrasController,
  MedicationCatalogController } from './workflows.controller';
@Module({
  imports:[AuthModule,InternalClientsModule],
  providers:[WorkflowsGatewayService],
  controllers:[PatientFlowsController,DoctorFlowsController,TreatmentFlowsController,
    NotificationsFlowsController,CareFlowsController,AppointmentExtrasController,MedicationCatalogController],
})
export class WorkflowsModule {}
