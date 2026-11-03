import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { RpcException } from '@nestjs/microservices';
import { Connection, Types } from 'mongoose';

/** Autorizaciones: se guardan en Identity, nunca en el navegador ni en Clinical. */
@Injectable()
export class SharingService {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  private get users() { return this.connection.db!.collection('users'); }
  private get patients() { return this.connection.db!.collection('patient_profiles'); }
  private get doctors() { return this.connection.db!.collection('doctor_profiles'); }
  private get grants() { return this.connection.db!.collection('doctor_access'); }
  private get members() { return this.connection.db!.collection('care_members'); }
  private fail(statusCode: number, message: string): never { throw new RpcException({statusCode, message}); }
  private oid(id: string) { if (!Types.ObjectId.isValid(id)) this.fail(400, 'Identificador inválido'); return new Types.ObjectId(id); }
  private async user(id: string) {
    const u = await this.users.findOne({ _id: this.oid(id) });
    if (!u) this.fail(404, 'Usuario no encontrado');
    return u;
  }
  private async patient(userId: string) {
    const u = await this.user(userId);
    if (u.role !== 'Paciente') this.fail(403, 'Acceso exclusivo para pacientes');
    const p = await this.patients.findOne({ id_user: userId });
    if (!p) this.fail(404, 'Completá primero el perfil de paciente');
    return { user: u, profile: p, id: p._id.toString() };
  }
  private async doctor(userId: string) {
    const u = await this.user(userId);
    if (u.role !== 'Doctor') this.fail(403, 'Acceso exclusivo para médicos');
    const d = await this.doctors.findOne({ id_user: userId });
    if (!d) this.fail(404, 'Completá primero el perfil profesional');
    return { user: u, profile: d };
  }
  private async owner(patientId: string) {
    const profile = await this.patients.findOne({ _id: this.oid(patientId) });
    if (!profile) this.fail(404, 'Paciente no encontrado');
    const ownerUser = await this.user(String(profile.id_user));
    return { profile, ownerUser };
  }
  private async allowedDoctor(doctorUserId: string, patientId: string) {
    await this.doctor(doctorUserId);
    const grant = await this.grants.findOne({patient_id: patientId, doctor_user_id: doctorUserId});
    if (!grant) this.fail(403, 'El paciente no autorizó el acceso de este profesional');
    return grant;
  }
  private async carePermission(userId: string, patientId: string, permission: string) {
    const { profile } = await this.owner(patientId);
    if (profile.id_user === userId) return { owner: true, relationship: 'Titular' };
    const member = await this.members.findOne({patient_id: patientId, user_id: userId, status: 'Activo'});
    if (!member || member[permission] !== true) this.fail(403, 'No tenés permiso para consultar estos datos');
    return { owner: false, relationship: String(member.relationship), member_id: member._id.toString() };
  }
  private formatMember(m: any, user?: any, owner?: any) {
    return {
      id_member: m._id.toString(), id_patient: m.patient_id, id_user: m.user_id,
      relationship: m.relationship, status: m.status,
      can_view_medication: Boolean(m.can_view_medication),
      can_record_intakes: Boolean(m.can_record_intakes),
      can_view_record: Boolean(m.can_view_record),
      member_name: user?.username ?? 'Usuario', member_email: user?.email ?? '',
      patient_name: owner?.username ?? '',
      created_at: m.created_at?.toISOString?.() ?? null,
    };
  }

  async execute(action: string, p: any): Promise<any> {
    const userId = String(p?.userId ?? '');
    if (!userId) this.fail(401, 'Identidad requerida');
    switch (action) {
      case 'doctor.grant': {
        const patient = await this.patient(userId);
        const email = String(p.email ?? '').trim().toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) this.fail(400, 'Correo inválido');
        const recipient = await this.users.findOne({email});
        if (!recipient || recipient.role !== 'Doctor') this.fail(404, 'No se encontró un médico con ese correo');
        const doc = await this.doctors.findOne({id_user: recipient._id.toString()});
        if (!doc) this.fail(404, 'El médico no completó su perfil profesional');
        await this.grants.createIndex({patient_id: 1,doctor_user_id: 1},{unique:true});
        await this.grants.updateOne({patient_id: patient.id, doctor_user_id: recipient._id.toString()},
          {$setOnInsert:{created_at:new Date()}},{upsert:true});
        return {message:'Acceso médico autorizado', doctor_email: email};
      }
      case 'doctor.aiConsent': {
        const patient=await this.patient(userId);
        if(typeof p.enabled!=='boolean')this.fail(400,'El consentimiento debe ser booleano');
        const row=await this.grants.findOneAndUpdate({patient_id:patient.id,doctor_user_id:String(p.doctorUserId)},
          {$set:{ai_consent:p.enabled}},{returnDocument:'after'});
        if(!row)this.fail(404,'Autorización no encontrada');
        return {message:p.enabled?'Uso de IA autorizado':'Uso de IA revocado',ai_consent:p.enabled};
      }
      case 'doctor.revoke': {
        const patient = await this.patient(userId);
        const result = await this.grants.deleteOne({patient_id:patient.id, doctor_user_id:String(p.doctorUserId)});
        if (!result.deletedCount) this.fail(404, 'Autorización no encontrada');
        return {message:'Autorización revocada'};
      }
      case 'doctor.grants': {
        const patient = await this.patient(userId);
        const rows = await this.grants.find({patient_id:patient.id}).toArray();
        return await Promise.all(rows.map(async g => {
          const doctor = await this.users.findOne({_id:this.oid(String(g.doctor_user_id))});
          return {doctor_user_id:g.doctor_user_id, doctor_name:doctor?.username ?? '', doctor_email:doctor?.email ?? '', granted_at:g.created_at, ai_consent:Boolean(g.ai_consent)};
        }));
      }
      case 'doctor.patients': {
        await this.doctor(userId);
        const grants = await this.grants.find({doctor_user_id:userId}).toArray();
        return await Promise.all(grants.map(async g => {
          const { profile, ownerUser } = await this.owner(String(g.patient_id));
          return {id_patient:profile._id.toString(), name:ownerUser.username, dni:profile.dni, health_insurance:profile.health_insurance};
        }));
      }
      case 'doctor.allowed': {
        await this.allowedDoctor(userId, String(p.patientId));
        const grant=await this.allowedDoctor(userId, String(p.patientId));
        return {allowed:true, ai_consent:Boolean(grant.ai_consent)};
      }
      case 'doctor.patient': {
        await this.allowedDoctor(userId, String(p.patientId));
        const { profile, ownerUser } = await this.owner(String(p.patientId));
        const details = await this.connection.db!.collection('patient_details').findOne({id_patient:profile._id.toString()});
        return {
          id_patient:profile._id.toString(), id_user:String(profile.id_user), name:ownerUser.username,
          dni:profile.dni, health_insurance:profile.health_insurance ?? null, plan:profile.plan ?? null,
          personal: details ? Object.fromEntries(Object.entries(details).filter(([k])=>!['_id','id_patient','__v'].includes(k))) : null,
        };
      }
      case 'doctor.patientByDni': {
        await this.doctor(userId);
        const patient = await this.patients.findOne({dni:String(p.dni ?? '')});
        if (!patient) this.fail(404, 'Paciente no encontrado');
        await this.allowedDoctor(userId, patient._id.toString());
        return this.execute('doctor.patient',{userId,patientId:patient._id.toString()});
      }
      case 'care.members': {
        const pat = await this.patient(userId);
        const rows = await this.members.find({patient_id:pat.id}).sort({created_at:-1}).toArray();
        return Promise.all(rows.map(async m=>this.formatMember(m,await this.users.findOne({_id:this.oid(String(m.user_id))}),pat.user)));
      }
      case 'care.invite': {
        const pat = await this.patient(userId);
        const email = String(p.email ?? '').trim().toLowerCase();
        const relationship = String(p.relationship ?? '');
        if (!['Familiar','Cuidador'].includes(relationship)) this.fail(400, 'Relación inválida');
        const dest = await this.users.findOne({email,role:'Paciente'});
        if (!dest || dest._id.toString() === userId) this.fail(404, 'Cuenta de paciente no encontrada');
        await this.members.createIndex({patient_id:1,user_id:1},{unique:true});
        const row={patient_id:pat.id,user_id:dest._id.toString(),relationship,status:'Pendiente',
          can_view_medication:true,can_record_intakes:relationship==='Cuidador',can_view_record:false,created_at:new Date()};
        try {const ins=await this.members.insertOne(row);return this.formatMember({...row,_id:ins.insertedId},dest,pat.user);}
        catch(e:any){if(e?.code===11000)this.fail(409,'La invitación ya existe');throw e;}
      }
      case 'care.invitations': {
        await this.user(userId);
        const rows=await this.members.find({user_id:userId,status:'Pendiente'}).toArray();
        return Promise.all(rows.map(async m=>this.formatMember(m,undefined,(await this.owner(String(m.patient_id))).ownerUser)));
      }
      case 'care.respond': {
        await this.user(userId);
        const id=this.oid(String(p.memberId));
        const update=String(p.decision)==='accept' ? {$set:{status:'Activo',accepted_at:new Date()}} : null;
        const row=update ? await this.members.findOneAndUpdate({_id:id,user_id:userId,status:'Pendiente'},update,{returnDocument:'after'}) : await this.members.findOneAndDelete({_id:id,user_id:userId,status:'Pendiente'});
        if(!row)this.fail(404,'Invitación no encontrada');
        return {message:update?'Invitación aceptada':'Invitación rechazada'};
      }
      case 'care.shared': {
        await this.user(userId);
        const rows=await this.members.find({user_id:userId,status:'Activo'}).toArray();
        return Promise.all(rows.map(async m=>this.formatMember(m,undefined,(await this.owner(String(m.patient_id))).ownerUser)));
      }
      case 'care.permissions': {
        const pat=await this.patient(userId);
        const change=p?.changes || {};
        const accepted=['can_view_medication','can_record_intakes','can_view_record'];
        const keys=Object.keys(change);
        if(!keys.length || keys.some(k=>!accepted.includes(k)||typeof change[k]!=='boolean'))this.fail(400,'Permisos inválidos');
        const row=await this.members.findOneAndUpdate({_id:this.oid(String(p.memberId)),patient_id:pat.id},{$set:change},{returnDocument:'after'});
        if(!row)this.fail(404,'Integrante no encontrado');
        return this.formatMember(row);
      }
      case 'care.remove': {
        const pat=await this.patient(userId);
        const result=await this.members.deleteOne({_id:this.oid(String(p.memberId)),patient_id:pat.id});
        if(!result.deletedCount)this.fail(404,'Integrante no encontrado');
        return {message:'Acceso revocado'};
      }
      case 'care.check': {
        await this.user(userId);
        const permission=String(p.permission??'');
        if(!['can_view_medication','can_record_intakes','can_view_record'].includes(permission))this.fail(400,'Permiso inválido');
        return this.carePermission(userId,String(p.patientId),permission);
      }
      default: this.fail(400,'Operación de Identity desconocida');
    }
  }
}
