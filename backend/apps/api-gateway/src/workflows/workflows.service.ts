import { HttpException, Inject, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout } from 'rxjs';

@Injectable()
export class WorkflowsGatewayService {
  constructor(@Inject('IDENTITY_CLIENT') private readonly identity: ClientProxy,
              @Inject('CLINICAL_CLIENT') private readonly clinical: ClientProxy) {}
  private async send(client: ClientProxy, pattern: string, action: string, data: any): Promise<any> {
    try {
      return await firstValueFrom(client.send(pattern,{action,data}).pipe(timeout(action.startsWith('appointments.file.') ? 45000 : 10000)));
    } catch(e:any) {
      const code=Number(e?.statusCode);
      if(code>=400 && code<500) throw new HttpException(e?.message||'Solicitud inválida',code);
      throw new ServiceUnavailableException(`No se pudo completar ${action}`);
    }
  }
  identityAction(action:string,data:any){return this.send(this.identity,'identity.workflows.execute',action,data);}
  clinicalAction(action:string,data:any){return this.send(this.clinical,'clinical.workflows.execute',action,data);}
  async patientId(userId:string) {
    try {
      const p=await firstValueFrom(this.identity.send('identity.patient.getProfile',userId).pipe(timeout(8000)));
      if(!(p as any)?.id_patient)throw {statusCode:404,message:'Completá el perfil de paciente primero'};
      return String((p as any).id_patient);
    } catch(e:any) {
      const code=Number(e?.statusCode);
      if(code>=400&&code<500)throw new HttpException(e.message,code);
      throw new ServiceUnavailableException('Identity Service no devolvió el perfil');
    }
  }
  async authorizedDoctor(userId:string,patientId:string) {
    await this.identityAction('doctor.allowed',{userId,patientId});
    return this.identityAction('doctor.patient',{userId,patientId});
  }
  async intakeAction(userId:string,intakeId:string,operation:string){
    const patientId=await this.patientId(userId);
    return this.clinicalAction('intakes.change',{patientId,actorUserId:userId,intakeId,operation});
  }
  async patientRecord(patientId:string){
    try{return await firstValueFrom(this.clinical.send('clinical.record.get',patientId).pipe(timeout(5000)));}
    catch(e:any){const code=Number(e?.statusCode);if(code>=400&&code<500)throw new HttpException(e.message,code);throw new ServiceUnavailableException('No se pudo consultar la ficha');}
  }
  async doctorPatient(userId:string,patientId:string){
    const info=await this.authorizedDoctor(userId,patientId);
    const [record,vaccines,consultations]=await Promise.allSettled([
      firstValueFrom(this.clinical.send('clinical.record.get',patientId).pipe(timeout(5000))),
      firstValueFrom(this.clinical.send('clinical.vaccine.list',patientId).pipe(timeout(5000))),
      this.clinicalAction('consultations.patient',{patientId}),
    ]);
    return {...info,
      medical_record:record.status==='fulfilled'?record.value:null,
      vaccines:vaccines.status==='fulfilled'?vaccines.value:[],
      consultations:consultations.status==='fulfilled'?consultations.value:[],
    };
  }
}
