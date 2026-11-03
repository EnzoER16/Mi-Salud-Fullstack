import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ collection: 'appointments', timestamps: true })
export class Appointment {
  @Prop({ type: String, required: true, index: true })
  id_patient!: string;

  @Prop({ type: String, required: true, maxlength: 100 })
  title!: string;

  @Prop({ type: Date, required: true })
  scheduled_at!: Date;

  @Prop({ type: String, default: null, maxlength: 100 })
  doctor_name!: string | null;

  @Prop({ type: String, default: null, maxlength: 100 })
  location!: string | null;

  @Prop({
    type: String,
    enum: ['Presencial', 'Virtual'],
    default: 'Presencial',
  })
  modality!: string;
}

export const AppointmentSchema =
  SchemaFactory.createForClass(Appointment);