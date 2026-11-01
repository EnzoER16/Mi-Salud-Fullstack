import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({
  collection: 'emergency_contacts',
  timestamps: true,
})
export class EmergencyContact {
  @Prop({
    type: String,
    required: true,
    index: true,
  })
  id_patient!: string;

  @Prop({
    type: String,
    required: true,
    maxlength: 80,
    trim: true,
  })
  name!: string;

  @Prop({
    type: String,
    default: null,
    maxlength: 40,
    trim: true,
  })
  relationship!: string | null;

  @Prop({
    type: String,
    required: true,
    maxlength: 25,
    trim: true,
  })
  phone!: string;

  @Prop({
    type: Number,
    required: true,
    min: 0,
    max: 4,
  })
  slot!: number;
}

export const EmergencyContactSchema =
  SchemaFactory.createForClass(EmergencyContact);

// Cada paciente dispone de cinco posiciones como máximo.
EmergencyContactSchema.index(
  { id_patient: 1, slot: 1 },
  { unique: true },
);