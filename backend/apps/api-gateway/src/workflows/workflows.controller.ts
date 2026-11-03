import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards, UseInterceptors, UploadedFiles, StreamableFile, ForbiddenException, ServiceUnavailableException } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { UserRole } from '@app/contracts';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { WorkflowsGatewayService as W } from './workflows.service';

type AuthReq={user:{sub:string;role:string}};
const patient=UserRole.PATIENT,doctor=UserRole.DOCTOR;

@ApiTags('Seguimiento clínico')
@ApiBearerAuth('JWT-auth')
@Controller('patient')
@UseGuards(JwtAuthGuard,RolesGuard)
@Roles(patient)
export class PatientFlowsController {
  constructor(private readonly w:W){}
  @Get('my-qr')
  async qr(@Req() r:AuthReq){const id=await this.w.patientId(r.user.sub);return {qr_data:id,message:'Compartí tu QR solo con profesionales autorizados'};}
  @Get('doctor-access')
  grants(@Req() r:AuthReq){return this.w.identityAction('doctor.grants',{userId:r.user.sub});}
  @Post('doctor-access')
  grant(@Req() r:AuthReq,@Body() body:any){return this.w.identityAction('doctor.grant',{userId:r.user.sub,email:body.email});}
  @Patch('doctor-access/:doctorId/ai-consent')
  consent(@Req() r:AuthReq,@Param('doctorId') doctorUserId:string,@Body() body:any){return this.w.identityAction('doctor.aiConsent',{userId:r.user.sub,doctorUserId,enabled:body.enabled});}
  @Delete('doctor-access/:doctorId')
  revoke(@Req() r:AuthReq,@Param('doctorId') doctorUserId:string){return this.w.identityAction('doctor.revoke',{userId:r.user.sub,doctorUserId});}
  @Get('history')
  async history(@Req() r:AuthReq){return this.w.clinicalAction('consultations.patient',{patientId:await this.w.patientId(r.user.sub)});}
}

@ApiTags('Portal médico')
@ApiBearerAuth('JWT-auth')
@Controller('doctor')
@UseGuards(JwtAuthGuard,RolesGuard)
@Roles(doctor)
export class DoctorFlowsController {
  constructor(private readonly w:W){}
  @Get('patients')
  patients(@Req() r:AuthReq){return this.w.identityAction('doctor.patients',{userId:r.user.sub});}
  @Get('patient/:dni')
  async search(@Req() r:AuthReq,@Param('dni') dni:string){
    const p=await this.w.identityAction('doctor.patientByDni',{userId:r.user.sub,dni});
    return this.w.doctorPatient(r.user.sub,p.id_patient);
  }
  @Get('patient/qr/:patientId')
  scan(@Req() r:AuthReq,@Param('patientId') id:string){return this.w.doctorPatient(r.user.sub,id);}
  @Get('history')
  history(@Req() r:AuthReq){return this.w.clinicalAction('consultations.doctor',{doctorUserId:r.user.sub});}
  @Get('patient/:patientId/clinical-analysis')
  async clinicalAnalysis(@Req() r:AuthReq,@Param('patientId') patientId:string){await this.w.authorizedDoctor(r.user.sub,patientId);return this.w.clinicalAction('clinical.analysis',{patientId});}
  @Get('patient/:patientId/ai-summary')
  async aiSummary(@Req() r:AuthReq,@Param('patientId') patientId:string){
    const permission=await this.w.identityAction('doctor.allowed',{userId:r.user.sub,patientId});
    if(!permission.ai_consent)throw new ForbiddenException('El paciente no autorizó procesar su información con IA');
    const apiKey=process.env.GEMINI_API_KEY;
    if(!apiKey)throw new ServiceUnavailableException('No está configurada GEMINI_API_KEY');
    const treatments=await this.w.clinicalAction('treatments.patient',{patientId});
    const consults=await this.w.clinicalAction('consultations.patient',{patientId});
    const finished=treatments.filter((t:any)=>t.end_date && new Date(t.end_date).getTime()<Date.now());
    const clinicalHistory={consultas:consults.map((c:any)=>({diagnostico:c.diagnosis,fecha:c.date})).slice(0,40),
      tratamientos: finished.map((t:any)=>({medicamento:t.medication,dosis:t.dose,adherencia_registrada:t.compliance,
        tomas_registradas:t.treatment_taken,total_tomas:t.treatment_total})).slice(0,40)};
    const prompt='Para un médico, resumí en español en 160 palabras la evolución DOCUMENTAL, adherencia registrada y preguntas para verificar. '+
      'Nunca diagnostiques ni indiques tratamientos. No infieras que una toma registrada se tomó realmente, ni que no registrar significa abandono. '+
      'No inventes información. Datos desidentificados: '+JSON.stringify(clinicalHistory);
    const model=process.env.GEMINI_MODEL||'gemini-2.5-flash';
    const response=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,{
      method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':apiKey},body:JSON.stringify({contents:[{parts:[{text:prompt}]}]}),signal:AbortSignal.timeout(30000)});
    if(!response.ok)throw new ServiceUnavailableException(`El proveedor de IA respondió HTTP ${response.status}`);
    const value:any=await response.json();
    const summary=value?.candidates?.[0]?.content?.parts?.map((p:any)=>p.text||'').join('\n')?.trim();
    if(!summary)throw new ServiceUnavailableException('El proveedor no devolvió un resumen');
    return {message:'Resumen generado',summary,finished_treatments:finished};
  }
  @Get('patient/:patientId/treatment-history-analysis')
  async treatmentAnalysis(@Req() r:AuthReq,@Param('patientId') patientId:string){
    await this.w.authorizedDoctor(r.user.sub,patientId);
    const rows=await this.w.clinicalAction('treatments.patient',{patientId});
    return {total:rows.length,treatments:rows,all_registered:rows.filter((x:any)=>x.treatment_total>0&&x.treatment_taken===x.treatment_total).length};
  }
}

@ApiTags('Consultas y tratamientos')
@ApiBearerAuth('JWT-auth')
@Controller()
@UseGuards(JwtAuthGuard,RolesGuard)
export class TreatmentFlowsController {
  constructor(private readonly w:W){}
  @Get('consultation/history/:patientId')
  async history(@Req() r:AuthReq,@Param('patientId') patientId:string){
    if(r.user.role===patient){if(await this.w.patientId(r.user.sub)!==patientId)throw new ForbiddenException();}
    else if(r.user.role===doctor)await this.w.authorizedDoctor(r.user.sub,patientId);
    else throw new ForbiddenException();
    return this.w.clinicalAction('consultations.patient',{patientId});
  }
  @Post('consultation/:patientId')
  @Roles(doctor)
  async consultation(@Req() r:AuthReq,@Param('patientId') patientId:string,@Body() b:any){
    await this.w.authorizedDoctor(r.user.sub,patientId);
    return this.w.clinicalAction('consultations.create',{patientId,doctorUserId:r.user.sub,location:b.location,diagnosis:b.diagnosis});
  }
  @Post('treatment/:consultationId')
  @Roles(doctor)
  async createTreatment(@Req() r:AuthReq,@Param('consultationId') consultationId:string,@Body() b:any){
    const c=await this.w.clinicalAction('consultations.one',{consultationId});
    const p=await this.w.authorizedDoctor(r.user.sub,c.id_patient);
    return this.w.clinicalAction('treatments.create',{consultationId,doctorUserId:r.user.sub,patientUserId:p.id_user,...b});
  }
  @Patch('treatment/:treatmentId')
  @Roles(doctor)
  async editTreatment(@Req() r:AuthReq,@Param('treatmentId') treatmentId:string,@Body() b:any){
    const info=await this.w.clinicalAction('treatments.info',{treatmentId});
    const p=await this.w.authorizedDoctor(r.user.sub,info.id_patient);
    return this.w.clinicalAction('treatments.edit',{treatmentId,doctorUserId:r.user.sub,patientUserId:p.id_user,...b});
  }
  @Get('treatment/my-treatments')
  @Roles(patient)
  async mine(@Req() r:AuthReq){return this.w.clinicalAction('treatments.patient',{patientId:await this.w.patientId(r.user.sub)});}
  @Get('treatment/patient/:patientId')
  @Roles(doctor)
  async doctorPatient(@Req() r:AuthReq,@Param('patientId') patientId:string){await this.w.authorizedDoctor(r.user.sub,patientId);return this.w.clinicalAction('treatments.doctorPatient',{patientId});}
  @Get('treatment/:treatmentId/history')
  @Roles(doctor)
  async treatmentHistory(@Req() r:AuthReq,@Param('treatmentId') treatmentId:string){
    const info=await this.w.clinicalAction('treatments.info',{treatmentId});await this.w.authorizedDoctor(r.user.sub,info.id_patient);
    return this.w.clinicalAction('treatments.history',{treatmentId});
  }
  @Patch('treatment/:treatmentId/reschedule')
  @Roles(patient)
  async reschedule(@Req() r:AuthReq,@Param('treatmentId') treatmentId:string,@Body() b:any){return this.w.clinicalAction('treatments.reschedule',{patientId:await this.w.patientId(r.user.sub),treatmentId,new_time:b.new_time});}
  @Get('intake/today')
  @Roles(patient)
  async today(@Req() r:AuthReq){return this.w.clinicalAction('intakes.today',{patientId:await this.w.patientId(r.user.sub)});}
  @Patch('intake/:intakeId/check')
  @Roles(patient)
  async check(@Req() r:AuthReq,@Param('intakeId') intakeId:string){return this.w.intakeAction(r.user.sub,intakeId,'check');}
  @Patch('intake/:intakeId/skip')
  @Roles(patient)
  async skip(@Req() r:AuthReq,@Param('intakeId') intakeId:string){return this.w.intakeAction(r.user.sub,intakeId,'skip');}
  @Patch('intake/:intakeId/postpone')
  @Roles(patient)
  async postpone(@Req() r:AuthReq,@Param('intakeId') intakeId:string){return this.w.intakeAction(r.user.sub,intakeId,'postpone');}
}

@ApiTags('Notificaciones')
@ApiBearerAuth('JWT-auth')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsFlowsController {
  constructor(private readonly w:W){}
  @Get('my')
  mine(@Req() r:AuthReq){return this.w.clinicalAction('notifications.list',{userId:r.user.sub});}
  @Patch('read-all')
  readAll(@Req() r:AuthReq){return this.w.clinicalAction('notifications.readAll',{userId:r.user.sub});}
  @Patch(':notificationId/read')
  read(@Req() r:AuthReq,@Param('notificationId') notificationId:string){return this.w.clinicalAction('notifications.read',{userId:r.user.sub,notificationId});}
}

@ApiTags('Grupos de cuidado')
@ApiBearerAuth('JWT-auth')
@Controller('care')
@UseGuards(JwtAuthGuard,RolesGuard)
@Roles(patient)
export class CareFlowsController {
  constructor(private readonly w:W){}
  @Get('members') members(@Req() r:AuthReq){return this.w.identityAction('care.members',{userId:r.user.sub});}
  @Post('invitations') invite(@Req() r:AuthReq,@Body() b:any){return this.w.identityAction('care.invite',{userId:r.user.sub,email:b.email,relationship:b.relationship});}
  @Get('invitations/mine') invitations(@Req() r:AuthReq){return this.w.identityAction('care.invitations',{userId:r.user.sub});}
  @Post('invitations/:memberId/accept') accept(@Req() r:AuthReq,@Param('memberId') memberId:string){return this.w.identityAction('care.respond',{userId:r.user.sub,memberId,decision:'accept'});}
  @Post('invitations/:memberId/decline') decline(@Req() r:AuthReq,@Param('memberId') memberId:string){return this.w.identityAction('care.respond',{userId:r.user.sub,memberId,decision:'decline'});}
  @Get('shared-with-me') shared(@Req() r:AuthReq){return this.w.identityAction('care.shared',{userId:r.user.sub});}
  @Patch('members/:memberId/permissions') permissions(@Req() r:AuthReq,@Param('memberId') memberId:string,@Body() changes:any){return this.w.identityAction('care.permissions',{userId:r.user.sub,memberId,changes});}
  @Delete('members/:memberId') remove(@Req() r:AuthReq,@Param('memberId') memberId:string){return this.w.identityAction('care.remove',{userId:r.user.sub,memberId});}
  @Get('patients/:patientId/medication')
  async medication(@Req() r:AuthReq,@Param('patientId') patientId:string){await this.w.identityAction('care.check',{userId:r.user.sub,patientId,permission:'can_view_medication'});return this.w.clinicalAction('treatments.patient',{patientId});}
  @Get('patients/:patientId/intakes/today')
  async sharedIntakes(@Req() r:AuthReq,@Param('patientId') patientId:string){
    await this.w.identityAction('care.check',{userId:r.user.sub,patientId,permission:'can_view_medication'});
    return this.w.clinicalAction('intakes.today',{patientId});
  }
  @Patch('patients/:patientId/intakes/:intakeId/check')
  async check(@Req() r:AuthReq,@Param('patientId') patientId:string,@Param('intakeId') intakeId:string){
    await this.w.identityAction('care.check',{userId:r.user.sub,patientId,permission:'can_view_medication'});
    await this.w.identityAction('care.check',{userId:r.user.sub,patientId,permission:'can_record_intakes'});
    return this.w.clinicalAction('intakes.change',{patientId,actorUserId:r.user.sub,intakeId,operation:'check'});
  }
  @Get('patients/:patientId/medical-record')
  async record(@Req() r:AuthReq,@Param('patientId') patientId:string){
    await this.w.identityAction('care.check',{userId:r.user.sub,patientId,permission:'can_view_record'});
    return this.w.patientRecord(patientId);
  }
  @Get('my-activity')
  async activity(@Req() r:AuthReq){return this.w.clinicalAction('care.activity',{patientId:await this.w.patientId(r.user.sub)});}
  @Get('patients/:patientId/activity')
  async memberActivity(@Req() r:AuthReq,@Param('patientId') patientId:string){
    const access=await this.w.identityAction('care.check',{userId:r.user.sub,patientId,permission:'can_view_medication'});
    if(access.relationship!=='Familiar')throw new ForbiddenException('Solo familiares autorizados');
    return this.w.clinicalAction('care.activity',{patientId});
  }
}

@ApiTags('Archivos y notas de turnos')
@ApiBearerAuth('JWT-auth')
@Controller('appointments')
@UseGuards(JwtAuthGuard,RolesGuard)
@Roles(patient)
export class AppointmentExtrasController {
  constructor(private readonly w:W){}
  private async id(r:AuthReq){return this.w.patientId(r.user.sub);}
  @Get(':appointmentId')
  async detail(@Req() r:AuthReq,@Param('appointmentId') appointmentId:string){return this.w.clinicalAction('appointments.detail',{patientId:await this.id(r),appointmentId});}
  @Post(':appointmentId/notes')
  async note(@Req() r:AuthReq,@Param('appointmentId') appointmentId:string,@Body() b:any){return this.w.clinicalAction('appointments.note.create',{patientId:await this.id(r),appointmentId,title:b.title,content:b.content});}
  @Patch('notes/:noteId')
  async editNote(@Req() r:AuthReq,@Param('noteId') noteId:string,@Body() b:any){return this.w.clinicalAction('appointments.note.edit',{patientId:await this.id(r),noteId,title:b.title,content:b.content});}
  @Delete('notes/:noteId')
  async removeNote(@Req() r:AuthReq,@Param('noteId') noteId:string){return this.w.clinicalAction('appointments.note.delete',{patientId:await this.id(r),noteId});}
  @Post(':appointmentId/files')
  @UseInterceptors(FilesInterceptor('files',5,{limits:{fileSize:10*1024*1024}}))
  async upload(@Req() r:AuthReq,@Param('appointmentId') appointmentId:string,
    @UploadedFiles() files: {originalname:string;buffer:Buffer;mimetype:string}[]){
    const contents=(files||[]).map(f=>({name:f.originalname,base64:f.buffer.toString('base64')}));
    return this.w.clinicalAction('appointments.file.upload',{patientId:await this.id(r),appointmentId,files:contents});
  }
  @Get('files/:fileId')
  async file(@Req() r:AuthReq,@Param('fileId') fileId:string){
    const f=await this.w.clinicalAction('appointments.file.get',{patientId:await this.id(r),fileId});
    return new StreamableFile(Buffer.from(f.base64,'base64'),{type:f.mime_type,disposition:`attachment; filename="${String(f.name).replace(/["\\\r\n]/g,'_')}"`});
  }
  @Delete('files/:fileId')
  async deleteFile(@Req() r:AuthReq,@Param('fileId') fileId:string){return this.w.clinicalAction('appointments.file.delete',{patientId:await this.id(r),fileId});}
}

const CATALOG={
  'Analgésicos y antiinflamatorios':['Paracetamol','Ibuprofeno','Diclofenac','Naproxeno'],
  'Antibióticos':['Amoxicilina','Azitromicina','Cefalexina'],
  'Cardiovasculares':['Losartán','Enalapril','Amlodipina','Atorvastatina'],
  'Antidiabéticos':['Metformina','Glimepirida'],
  'Respiratorios y antialérgicos':['Salbutamol','Budesonida','Loratadina','Cetirizina'],
  'Digestivos':['Omeprazol','Pantoprazol'],
};
@ApiTags('Medicamentos')
@ApiBearerAuth('JWT-auth')
@Controller('medication')
@UseGuards(JwtAuthGuard,RolesGuard)
@Roles(doctor)
export class MedicationCatalogController {
  @Get()
  list(){return Object.entries(CATALOG).flatMap(([category,names])=>names.map((name,i)=>({id_medication:`${category}-${i}`,category,name})));}
}
