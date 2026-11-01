import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({
  collection: 'doctor_profiles',
  timestamps: true,
})
export class DoctorProfile {
  @Prop({ type: String, required: true, unique: true })
  id_user!: string;

  @Prop({ type: String, required: true })
  specialty!: string;

  @Prop({ type: String, required: true })
  license_number!: string;
}

export const DoctorProfileSchema =
  SchemaFactory.createForClass(DoctorProfile);