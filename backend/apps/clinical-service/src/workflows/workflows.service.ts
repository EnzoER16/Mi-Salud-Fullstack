import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { RpcException } from '@nestjs/microservices';
import { Connection, Types, mongo } from 'mongoose';
import { Readable } from 'node:stream';

/** Clinical Service: consultas, tratamientos, tomas, avisos y documentación de turnos. */
@Injectable()
export class WorkflowsService implements OnModuleInit, OnModuleDestroy {
  private reminderTimer?: ReturnType<typeof setInterval>;
  onModuleInit() {
    // Solo notificación interna. No envía información de salud por correo sin configurar consentimientos.
    this.reminderTimer = setInterval(() => this.sendUpcomingAlerts().catch(e => console.warn('Avisos de tomas:', e?.message)), 60_000);
    this.reminderTimer.unref?.();
  }
  onModuleDestroy() { if (this.reminderTimer) clearInterval(this.reminderTimer); }
  private async sendUpcomingAlerts() {
    const now=new Date();const soon=new Date(now.getTime()+5*60_000);
    const rows=await this.intakes.find({status:'Pendiente',notified:{$ne:true},scheduled_time:{$gte:new Date(now.getTime()-10*60_000),$lte:soon}}).limit(100).toArray();
    for(const i of rows){
      const t=await this.treatments.findOne({_id:this.oid(String(i.treatment_id))});
      if(!t?.patient_user_id)continue;
      const claim=await this.intakes.updateOne({_id:i._id,notified:{$ne:true}},{$set:{notified:true}});
      if(claim.modifiedCount)await this.notify(String(t.patient_user_id),`Recordatorio de toma: ${t.medication}`,`${t.dose} · ${this.date(i.scheduled_time)}`);
    }
  }
  constructor(@InjectConnection() private readonly connection: Connection) {}
  private get db() { return this.connection.db!; }
  private get consultations() { return this.connection.db!.collection('consultations'); }
  private get treatments() {
    return this.connection.db!.collection<{
      consultation_id: string;
      medication: string;
      dose: string;
      frequency_hours: number;
      duration_days: number;
      instructions: string | null;
      patient_user_id: string;
      created_at: Date;
      history: { date_modified: Date; changes_details: string }[];
    }>('treatments');
  }
  private get intakes() { return this.connection.db!.collection('medication_intakes'); }
  private get notifications() { return this.connection.db!.collection('notifications'); }
  private get appointments() { return this.connection.db!.collection('appointments'); }
  private get notes() { return this.connection.db!.collection('appointment_notes'); }
  private get files() { return this.connection.db!.collection('appointment_files'); }
  private get activities() { return this.connection.db!.collection('care_activities'); }
  private fail(statusCode:number,message:string):never {throw new RpcException({statusCode,message});}
  private oid(id:string){if(!Types.ObjectId.isValid(id))this.fail(400,'Identificador inválido');return new Types.ObjectId(id);}
  private requireText(v:unknown,label:string,max=255):string {
    if(typeof v!=='string'||!v.trim()||v.trim().length>max)this.fail(400,`Valor inválido: ${label}`);
    return v.trim();
  }
  private date(value:any){return value instanceof Date?value.toISOString():typeof value==='string'?new Date(value).toISOString():null;}
  private async ownedAppointment(patientId:string,id:string){
    const a=await this.appointments.findOne({_id:this.oid(id),id_patient:patientId});
    if(!a)this.fail(404,'Turno no encontrado');return a;
  }
  private async consultation(id:string){const c=await this.consultations.findOne({_id:this.oid(id)});if(!c)this.fail(404,'Consulta no encontrada');return c;}
  private async treatment(id:string){const t=await this.treatments.findOne({_id:this.oid(id)});if(!t)this.fail(404,'Tratamiento no encontrado');return t;}
  private async treatmentOwned(patientId:string,id:string){
    const t=await this.treatment(id);const c=await this.consultation(String(t.consultation_id));
    if(c.patient_id!==patientId)this.fail(404,'Tratamiento no encontrado');return {t,c};
  }
  private formatConsult(c:any){return {id_consultation:c._id.toString(),id_patient:c.patient_id,id_doctor:c.doctor_user_id,date:this.date(c.date),location:c.location,diagnosis:c.diagnosis};}
  private async formatTreatment(t:any){
    const entries=await this.intakes.find({treatment_id:t._id.toString()}).toArray();
    const taken=entries.filter(i=>i.status==='Tomado').length;
    const pending=entries.filter(i=>i.status==='Pendiente').sort((a,b)=>+a.scheduled_time-+b.scheduled_time)[0];
    return {id_treatment:t._id.toString(),id_consultation:t.consultation_id,medication:t.medication,dose:t.dose,
      frequency_hours:t.frequency_hours,duration_days:t.duration_days,instructions:t.instructions??null,
      compliance:entries.length?Math.round(10000*taken/entries.length)/100:0,
      treatment_taken:taken,treatment_total:entries.length,
      end_date:new Date(new Date(t.created_at??Date.now()).getTime()+Number(t.duration_days)*86_400_000).toISOString(),
      next_intake_time:pending?.scheduled_time?.toISOString?.()??null};
  }
  private async notify(userId:string,message:string,details?:string){
    if(userId)await this.notifications.insertOne({user_id:userId,message,details:details??null,is_read:false,created_at:new Date()});
  }
  private async schedule(treatmentId:string,start:Date,frequency:number,duration:number){
    const total=Math.ceil(duration*24/frequency);
    if(total>1000)this.fail(400,'El tratamiento genera demasiadas tomas');
    const items=[];
    for(let i=0;i<total;i++){
      const when=new Date(start.getTime()+i*frequency*3_600_000);
      if(when>=new Date(start.getTime()+duration*86_400_000))break;
      items.push({treatment_id:treatmentId,scheduled_time:when,status:'Pendiente',taken_time:null});
    }
    if(items.length)await this.intakes.insertMany(items);
  }
  private async getRelevantConsultations(patientId:string){return this.consultations.find({patient_id:patientId}).sort({date:-1}).toArray();}
  private async getRelevantTreatments(patientId:string){
    const consults=await this.getRelevantConsultations(patientId);
    if(!consults.length)return [];
    const ids=consults.map(c=>c._id.toString());
    return this.treatments.find({consultation_id:{$in:ids}}).sort({created_at:-1}).toArray();
  }
  private isoRangeToday(){
    const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Argentina/Mendoza',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
    const v=Object.fromEntries(parts.map(x=>[x.type,x.value]));
    const start=new Date(`${v.year}-${v.month}-${v.day}T03:00:00.000Z`);
    return {start,end:new Date(start.getTime()+86_400_000)};
  }
  private async formatIntake(row:any){
    const t=await this.treatments.findOne({_id:this.oid(String(row.treatment_id))});
    const c=t?await this.consultations.findOne({_id:this.oid(String(t.consultation_id))}):null;
    const count=t?await this.intakes.countDocuments({treatment_id:String(t._id)}):0;
    const taken=t?await this.intakes.countDocuments({treatment_id:String(t._id),status:'Tomado'}):0;
    return {id_intake:row._id.toString(),id_treatment:row.treatment_id,scheduled_time:this.date(row.scheduled_time),
      taken_time:row.taken_time?this.date(row.taken_time):null,status:row.status,medication:t?.medication??'',
      dose:t?.dose??'',diagnosis:c?.diagnosis??'',frequency_hours:t?.frequency_hours??null,
      duration_days:t?.duration_days??null,instructions:t?.instructions??null,treatment_taken:taken,treatment_total:count};
  }
  private async activity(patientId:string,actorUserId:string,intakeId:string, action:string){
    await this.activities.insertOne({patient_id:patientId,actor_user_id:actorUserId,intake_id:intakeId,action,created_at:new Date()});
  }

  async execute(action:string,p:any):Promise<any>{
    switch(action){
      case 'consultations.create': {
        const patientId=String(p.patientId);this.oid(patientId);
        const location=this.requireText(p.location,'Lugar',100);
        const diagnosis=this.requireText(p.diagnosis,'Diagnóstico',2000);
        const result=await this.consultations.insertOne({patient_id:patientId,doctor_user_id:String(p.doctorUserId),date:new Date(),location,diagnosis});
        return {message:'Consulta médica registrada',consultation:this.formatConsult({_id:result.insertedId,patient_id:patientId,doctor_user_id:p.doctorUserId,date:new Date(),location,diagnosis})};
      }
      case 'consultations.one':{
        const row=await this.consultation(String(p.consultationId));return this.formatConsult(row);
      }
      case 'treatments.info':{
        const t=await this.treatment(String(p.treatmentId));const c=await this.consultation(String(t.consultation_id));
        return {...await this.formatTreatment(t),id_patient:c.patient_id,doctor_user_id:c.doctor_user_id};
      }
      case 'consultations.patient':{
        const rows=await this.getRelevantConsultations(String(p.patientId));return rows.map(r=>this.formatConsult(r));
      }
      case 'consultations.doctor':{
        const rows=await this.consultations.find({doctor_user_id:String(p.doctorUserId)}).sort({date:-1}).toArray();return rows.map(r=>this.formatConsult(r));
      }
      case 'treatments.create':{
        const c=await this.consultation(String(p.consultationId));
        if(String(c.doctor_user_id)!==String(p.doctorUserId))this.fail(403,'Solo el profesional de la consulta puede recetar');
        const medication=this.requireText(p.medication,'Medicamento',100),dose=this.requireText(p.dose,'Dosis',50);
        const frequency=Number(p.frequency_hours),duration=Number(p.duration_days);
        if(!Number.isInteger(frequency)||frequency<1||frequency>168||!Number.isInteger(duration)||duration<1||duration>365||Math.ceil(duration*24/frequency)>1000)
          this.fail(400,'Frecuencia o duración inválida (máximo 1000 tomas)');
        const instructions=typeof p.instructions==='string'?p.instructions.trim().slice(0,255):null;
        const result=await this.treatments.insertOne({consultation_id:c._id.toString(),medication,dose,frequency_hours:frequency,duration_days:duration,
          instructions,patient_user_id:String(p.patientUserId||''),created_at:new Date(),history:[]});
        await this.schedule(result.insertedId.toString(),new Date(),frequency,duration);
        await this.notify(String(p.patientUserId),`Nuevo tratamiento: ${medication}`,`${dose} cada ${frequency} horas durante ${duration} días`);
        return {message:'Tratamiento y tomas generadas',treatment:await this.formatTreatment({...p,_id:result.insertedId,consultation_id:c._id.toString(),medication,dose,frequency_hours:frequency,duration_days:duration,instructions})};
      }
      case 'treatments.patient':{
        const rows=await this.getRelevantTreatments(String(p.patientId));return Promise.all(rows.map(async t=>this.formatTreatment(t)));
      }
      case 'treatments.doctorPatient':{
        const rows=await this.getRelevantTreatments(String(p.patientId));return Promise.all(rows.map(async t=>this.formatTreatment(t)));
      }
      case 'treatments.history':{
        const t=await this.treatment(String(p.treatmentId));return t.history??[];
      }
      case 'treatments.edit':{
        const t=await this.treatment(String(p.treatmentId));const c=await this.consultation(String(t.consultation_id));
        if(String(c.doctor_user_id)!==String(p.doctorUserId))this.fail(403,'No podés modificar recetas de otro profesional');
        if(new Date(t.created_at).getTime()+Number(t.duration_days)*86_400_000<=Date.now())this.fail(400,'El tratamiento finalizó');
        const dose=p.dose===undefined?t.dose:this.requireText(p.dose,'Dosis',50);
        const frequency=p.frequency_hours===undefined?t.frequency_hours:Number(p.frequency_hours);
        const duration=p.duration_days===undefined?t.duration_days:Number(p.duration_days);
        if(!Number.isInteger(frequency)||frequency<1||frequency>168||!Number.isInteger(duration)||duration<1||duration>365||Math.ceil(duration*24/frequency)>1000)this.fail(400,'Frecuencia o duración inválida');
        const change=`${new Date().toISOString()}: ${t.dose}/${t.frequency_hours}h/${t.duration_days}d → ${dose}/${frequency}h/${duration}d`;
        await this.treatments.updateOne({_id:t._id},{$set:{dose,frequency_hours:frequency,duration_days:duration},$push:{history:{date_modified:new Date(),changes_details:change}}});
        await this.intakes.deleteMany({treatment_id:t._id.toString(),status:'Pendiente',scheduled_time:{$gt:new Date()}});
        const remaining=duration*86_400_000-(Date.now()-new Date(t.created_at).getTime());
        if(remaining>0){
          // Crear solo las tomas realmente comprendidas entre la proxima frecuencia y el fin del tratamiento.
          // Math.floor(remaining/dia) dejaba cero tomas cuando quedaban menos de 24 horas.
          const intervalMs=frequency*3_600_000;
          const endMs=new Date(t.created_at).getTime()+duration*86_400_000;
          const pending=[];
          for(let at=Date.now()+intervalMs;at<endMs;at+=intervalMs){
            pending.push({treatment_id:t._id.toString(),scheduled_time:new Date(at),status:'Pendiente',taken_time:null,notified:false});
            if(pending.length>1000)this.fail(400,'Demasiadas tomas');
          }
          if(pending.length)await this.intakes.insertMany(pending);
        }
        if(p.patientUserId)await this.notify(String(p.patientUserId),`Cambios en tratamiento: ${t.medication}`,change);
        return {message:'Tratamiento actualizado',treatment:await this.formatTreatment({...t,dose,frequency_hours:frequency,duration_days:duration})};
      }
      case 'treatments.reschedule':{
        const {t}=await this.treatmentOwned(String(p.patientId),String(p.treatmentId));
        const first=new Date(String(p.new_time));
        if(Number.isNaN(+first)||first.getTime()<Date.now()-60_000)this.fail(400,'Horario inválido');
        const pending=await this.intakes.find({treatment_id:t._id.toString(),status:'Pendiente'}).sort({scheduled_time:1}).toArray();
        if(!pending.length)this.fail(400,'No quedan tomas pendientes');
        for(let i=0;i<pending.length;i++){
          await this.intakes.updateOne({_id:pending[i]._id,status:'Pendiente'},{$set:{scheduled_time:new Date(first.getTime()+i*Number(t.frequency_hours)*3_600_000)}});
        }
        await this.treatments.updateOne({_id:t._id},{$push:{history:{date_modified:new Date(),changes_details:'El paciente reprogramó las tomas pendientes'}}});
        return {message:'Horarios de tomas reprogramados'};
      }
      case 'intakes.today':{
        const ts=await this.getRelevantTreatments(String(p.patientId));if(!ts.length)return [];
        const {start,end}=this.isoRangeToday();
        const rows=await this.intakes.find({treatment_id:{$in:ts.map(t=>t._id.toString())},scheduled_time:{$gte:start,$lt:end}}).sort({scheduled_time:1}).toArray();
        return Promise.all(rows.map(i=>this.formatIntake(i)));
      }
      case 'intakes.change':{
        const patientId=String(p.patientId),actorUserId=String(p.actorUserId),op=String(p.operation);
        const row=await this.intakes.findOne({_id:this.oid(String(p.intakeId))});
        if(!row)this.fail(404,'Toma no encontrada');
        const {c}=await this.treatmentOwned(patientId,String(row.treatment_id));
        if(c.patient_id!==patientId)this.fail(404,'Toma no encontrada');
        if(!['check','skip','postpone'].includes(op))this.fail(400,'Acción inválida');
        if(op==='check'&&new Date(row.scheduled_time)>new Date())this.fail(400,'No se puede confirmar una toma futura');
        const set=op==='check'?{status:'Tomado',taken_time:new Date()}:op==='skip'?{status:'Omitido'}:{scheduled_time:new Date(new Date(row.scheduled_time).getTime()+3_600_000),notified:false};
        const changed=await this.intakes.findOneAndUpdate({_id:row._id,status:'Pendiente'},{$set:set},{returnDocument:'after'});
        if(!changed)this.fail(409,'La toma ya fue registrada');
        await this.activity(patientId,actorUserId,row._id.toString(),op==='check'?'intake_recorded':op);
        return {message:op==='check'?'Toma registrada':op==='skip'?'Toma omitida':'Toma pospuesta 1 hora',intake:await this.formatIntake(changed)};
      }
      case 'notifications.list':{
        const all=await this.notifications.find({user_id:String(p.userId)}).sort({created_at:-1}).limit(20).toArray();
        const unread=await this.notifications.countDocuments({user_id:String(p.userId),is_read:false});
        return {unread_count:unread,notifications:all.map(n=>({id_notification:n._id.toString(),message:n.message,details:n.details,is_read:n.is_read,created_at:this.date(n.created_at)}))};
      }
      case 'notifications.readAll':{
        await this.notifications.updateMany({user_id:String(p.userId),is_read:false},{$set:{is_read:true}});return {message:'Notificaciones leídas'};
      }
      case 'notifications.read':{
        const n=await this.notifications.findOneAndUpdate({_id:this.oid(String(p.notificationId)),user_id:String(p.userId)},{$set:{is_read:true}},{returnDocument:'after'});
        if(!n)this.fail(404,'Notificación no encontrada');return {message:'Notificación leída'};
      }
      case 'care.activity':{
        const rows=await this.activities.find({patient_id:String(p.patientId)}).sort({created_at:-1}).limit(50).toArray();
        return rows.map(i=>({id_activity:i._id.toString(),id_intake:i.intake_id,actor_id:i.actor_user_id,action:i.action,created_at:this.date(i.created_at)}));
      }
      case 'appointments.detail':{
        const a=await this.ownedAppointment(String(p.patientId),String(p.appointmentId));
        const notes=await this.notes.find({appointment_id:a._id.toString()}).toArray();
        const files=await this.files.find({appointment_id:a._id.toString()}).toArray();
        return {id_appointment:a._id.toString(),title:a.title,scheduled_at:this.date(a.scheduled_at),doctor_name:a.doctor_name??null,
          location:a.location??null,modality:a.modality??'Presencial',note_count:notes.length,file_count:files.length,
          notes:notes.map(n=>this.formatNote(n)),files:files.map(f=>this.formatFile(f))};
      }
      case 'appointments.note.create':{
        await this.ownedAppointment(String(p.patientId),String(p.appointmentId));
        const title=String(p.title??'Nota').trim().slice(0,100)||'Nota';const content=this.requireText(p.content,'Contenido',2000);
        const result=await this.notes.insertOne({appointment_id:String(p.appointmentId),title,content,created_at:new Date(),updated_at:new Date()});
        return this.formatNote({_id:result.insertedId,title,content,created_at:new Date(),updated_at:new Date()});
      }
      case 'appointments.note.edit':{
        const note=await this.notes.findOne({_id:this.oid(String(p.noteId))});if(!note)this.fail(404,'Nota no encontrada');
        await this.ownedAppointment(String(p.patientId),String(note.appointment_id));
        const title=String(p.title??note.title).trim().slice(0,100)||'Nota';const content=this.requireText(p.content,'Contenido',2000);
        const updated=await this.notes.findOneAndUpdate({_id:note._id},{$set:{title,content,updated_at:new Date()}},{returnDocument:'after'});
        return this.formatNote(updated);
      }
      case 'appointments.note.delete':{
        const note=await this.notes.findOne({_id:this.oid(String(p.noteId))});if(!note)this.fail(404,'Nota no encontrada');
        await this.ownedAppointment(String(p.patientId),String(note.appointment_id));
        await this.notes.deleteOne({_id:note._id});return {message:'Nota eliminada'};
      }
      case 'appointments.file.upload':{
        await this.ownedAppointment(String(p.patientId),String(p.appointmentId));
        const files=Array.isArray(p.files)?p.files:[];
        const existing=await this.files.countDocuments({appointment_id:String(p.appointmentId)});
        if(!files.length||existing+files.length>20)this.fail(400,'Hasta 20 archivos por turno');
        const result=[];
        for(const f of files){
          const name=this.requireText(String(f.name||''),'Nombre del archivo',150).replace(/[\\/\x00-\x1f]/g,'_');
          const bytes=Buffer.from(String(f.base64||''),'base64');
          if(bytes.length<1||bytes.length>10*1024*1024)this.fail(400,'El archivo debe medir entre 1 byte y 10 MB');
          const sig=bytes.subarray(0,8);
          const mime=sig.subarray(0,5).toString()==='%PDF-'?'application/pdf':
            sig.subarray(0,3).equals(Buffer.from([0xff,0xd8,0xff]))?'image/jpeg':
            sig.equals(Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]))?'image/png':null;
          const ext=name.split('.').pop()?.toLowerCase();
          if(!mime||!(mime==='application/pdf'&&ext==='pdf'||mime==='image/jpeg'&&['jpg','jpeg'].includes(ext||'')||mime==='image/png'&&ext==='png'))this.fail(400,'Solo PDF, JPG y PNG reales');
          const bucket=new mongo.GridFSBucket(this.db,{bucketName:'appointment_uploads'});
          const upload=bucket.openUploadStream(name,{metadata:{contentType:mime}});
          await new Promise<void>((resolve,reject)=>{Readable.from(bytes).pipe(upload).on('finish',()=>resolve()).on('error',reject);});
          const item={appointment_id:String(p.appointmentId),gridfs_id:upload.id.toString(),original_name:name,mime_type:mime,size_bytes:bytes.length,created_at:new Date()};
          const inserted=await this.files.insertOne(item);result.push(this.formatFile({...item,_id:inserted.insertedId}));
        }
        return {files:result,errors:[]};
      }
      case 'appointments.file.get':{
        const f=await this.files.findOne({_id:this.oid(String(p.fileId))});if(!f)this.fail(404,'Archivo no encontrado');
        await this.ownedAppointment(String(p.patientId),String(f.appointment_id));
        const bucket=new mongo.GridFSBucket(this.db,{bucketName:'appointment_uploads'});
        const chunks:Buffer[]=[];
        await new Promise<void>((resolve,reject)=>{
          bucket.openDownloadStream(this.oid(String(f.gridfs_id))).on('data',(chunk:Buffer)=>chunks.push(chunk)).on('end',resolve).on('error',reject);
        });
        return {name:f.original_name,mime_type:f.mime_type,base64:Buffer.concat(chunks).toString('base64')};
      }
      case 'appointments.file.delete':{
        const f=await this.files.findOne({_id:this.oid(String(p.fileId))});if(!f)this.fail(404,'Archivo no encontrado');
        await this.ownedAppointment(String(p.patientId),String(f.appointment_id));
        const bucket=new mongo.GridFSBucket(this.db,{bucketName:'appointment_uploads'});
        await bucket.delete(this.oid(String(f.gridfs_id)));
        await this.files.deleteOne({_id:f._id});return {message:'Archivo eliminado'};
      }
      case 'clinical.analysis':{
        const consults=await this.getRelevantConsultations(String(p.patientId));const count=new Map<string,number>();
        const recent=new Map<string,number>();const cutoff=Date.now()-60*86_400_000;
        for(const c of consults){
          const key=String(c.diagnosis||'Sin diagnóstico');count.set(key,(count.get(key)??0)+1);
          if(new Date(c.date).getTime()>=cutoff)recent.set(key,(recent.get(key)??0)+1);
        }
        const months=new Map<string,number>();for(const c of consults){const k=this.date(c.date)?.slice(0,7)??'Desconocido';months.set(k,(months.get(k)??0)+1);}
        return {total:consults.length,diagnoses:[...count.entries()].map(([diagnosis,n])=>({diagnosis,count:n,percentage:consults.length?Math.round(n*1000/consults.length)/10:0})).sort((a,b)=>b.count-a.count),
          months:[...months.entries()].map(([month,n])=>({month,count:n})),consultations:consults.map(c=>this.formatConsult(c)),
          recurrence_alerts:[...recent.entries()].filter(([,n])=>n>=5).map(([diagnosis,n])=>({diagnosis,count:n,days:60})),threshold:{min_consultations:5,days:60}};
      }
      default:this.fail(400,'Operación clínica desconocida');
    }
  }
  private formatNote(n:any){return {id_note:n._id.toString(),title:n.title,content:n.content,created_at:this.date(n.created_at),updated_at:this.date(n.updated_at)};}
  private formatFile(f:any){return {id_file:f._id.toString(),id_appointment:f.appointment_id,name:f.original_name,mime_type:f.mime_type,size_bytes:f.size_bytes,created_at:this.date(f.created_at)};}
}
