import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({
  collection: 'doctor_details',
  timestamps: true,
})
export class DoctorDetails {
  @Prop({ type: String, required: true, unique: true })
  id_user!: string;

  @Prop({ type: String, default: null })
  first_name!: string | null;

  @Prop({ type: String, default: null })
  last_name!: string | null;

  @Prop({ type: String, default: null })
  birth_date!: string | null;

  @Prop({ type: String, default: null })
  phone!: string | null;

  @Prop({ type: String, default: null })
  locality!: string | null;

  @Prop({ type: String, default: null })
  workplace!: string | null;

  @Prop({ type: String, default: null })
  office_address!: string | null;

  @Prop({ type: String, default: null })
  attention_hours!: string | null;

  @Prop({ type: String, default: null })
  accepted_insurances!: string | null;

  @Prop({ type: String, default: null })
  bio!: string | null;
}

export const DoctorDetailsSchema =
  SchemaFactory.createForClass(DoctorDetails);