import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({
  collection: 'patient_details',
  timestamps: true,
})
export class PatientDetails {
  @Prop({ type: String, required: true, unique: true })
  id_user!: string;

  @Prop({ type: String, default: null })
  first_name!: string | null;

  @Prop({ type: String, default: null })
  last_name!: string | null;

  @Prop({ type: String, default: null })
  birth_date!: string | null;

  @Prop({ type: String, default: null })
  sex!: string | null;

  @Prop({ type: String, default: null })
  marital_status!: string | null;

  @Prop({ type: String, default: null })
  occupation!: string | null;

  @Prop({ type: String, default: null })
  phone!: string | null;

  @Prop({ type: String, default: null })
  locality!: string | null;

  @Prop({ type: String, default: null })
  province!: string | null;

  @Prop({ type: String, default: null })
  postal_code!: string | null;
}

export const PatientDetailsSchema =
  SchemaFactory.createForClass(PatientDetails);