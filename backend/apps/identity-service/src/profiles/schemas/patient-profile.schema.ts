import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({
  collection: 'patient_profiles',
  timestamps: true,
})
export class PatientProfile {
  @Prop({ type: String, required: true, unique: true })
  id_user!: string;

  @Prop({ type: String, required: true, unique: true })
  dni!: string;

  @Prop({ type: String, default: '' })
  health_insurance!: string;

  @Prop({ type: String, default: '' })
  plan!: string;

  @Prop({ type: String, default: '' })
  member_number!: string;

  @Prop({ type: String, default: '' })
  address!: string;
}

export const PatientProfileSchema =
  SchemaFactory.createForClass(PatientProfile);