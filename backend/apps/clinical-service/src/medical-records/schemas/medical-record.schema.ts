import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BLOOD_GROUPS } from '@app/contracts';

@Schema({
  collection: 'medical_records',
  timestamps: true,
})
export class MedicalRecord {
  @Prop({ type: String, required: true, unique: true })
  id_patient!: string;

  @Prop({
    type: String,
    enum: [...BLOOD_GROUPS],
    default: null,
  })
  blood_group!: string | null;

  @Prop({ type: String, default: null, maxlength: 2000 })
  allergies!: string | null;

  @Prop({ type: String, default: null, maxlength: 2000 })
  antecedents!: string | null;

  @Prop({ type: Number, default: null, min: 1, max: 500 })
  weight_kg!: number | null;

  @Prop({ type: Number, default: null, min: 30, max: 260 })
  height_cm!: number | null;

  @Prop({ type: [String], default: [] })
  conditions!: string[];

  @Prop({ type: String, default: null, maxlength: 2000 })
  intolerances!: string | null;

  @Prop({ type: String, default: null, maxlength: 2000 })
  surgeries!: string | null;

  @Prop({ type: String, default: null, maxlength: 2000 })
  family_history!: string | null;

  @Prop({ type: String, default: null, maxlength: 2000 })
  current_medication!: string | null;

  @Prop({ type: Boolean, default: null })
  wears_glasses!: boolean | null;

  @Prop({ type: String, default: null })
  last_checkup!: string | null;

  @Prop({ type: String, default: null })
  last_dental_checkup!: string | null;

  @Prop({ type: String, default: null, maxlength: 100 })
  primary_doctor_name!: string | null;

  @Prop({ type: String, default: null, maxlength: 25 })
  primary_doctor_phone!: string | null;

  @Prop({ type: String, default: null, maxlength: 120 })
  care_center!: string | null;
}

export const MedicalRecordSchema =
  SchemaFactory.createForClass(MedicalRecord);