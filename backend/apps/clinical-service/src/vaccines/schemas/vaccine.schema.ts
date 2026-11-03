import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ collection: 'vaccines', timestamps: true })
export class Vaccine {
  @Prop({ type: String, required: true, index: true })
  id_patient!: string;

  @Prop({ type: String, required: true, maxlength: 100 })
  name!: string;

  @Prop({ type: String, default: null, maxlength: 40 })
  dose!: string | null;

  @Prop({ type: String, default: null })
  applied_on!: string | null;

  @Prop({ type: String, default: null })
  next_dose_on!: string | null;

  @Prop({ type: String, default: null, maxlength: 100 })
  place!: string | null;

  @Prop({ type: String, default: null, maxlength: 255 })
  notes!: string | null;
}

export const VaccineSchema = SchemaFactory.createForClass(Vaccine);