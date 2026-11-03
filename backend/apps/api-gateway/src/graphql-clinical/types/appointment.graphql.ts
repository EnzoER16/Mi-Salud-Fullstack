import { Field, ID, Int, InputType, ObjectType } from '@nestjs/graphql';
import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Matches,
} from 'class-validator';

@ObjectType('Appointment')
export class AppointmentObject {
  @Field(() => ID)
  id_appointment!: string;

  @Field(() => String)
  title!: string;

  @Field(() => String)
  scheduled_at!: string;

  @Field(() => String, { nullable: true })
  doctor_name!: string | null;

  @Field(() => String, { nullable: true })
  location!: string | null;

  @Field(() => String)
  modality!: string;

  @Field(() => Int)
  file_count!: number;

  @Field(() => Int)
  note_count!: number;
}

@InputType()
export class CreateAppointmentInput {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  title!: string;

  @Field(() => String)
  @IsString()
  @Matches(
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/,
    { message: 'La fecha debe incluir hora y zona horaria' },
  )
  scheduled_at!: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  doctor_name?: string | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  location?: string | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsIn(['Presencial', 'Virtual'])
  modality?: string;
}

@InputType()
export class UpdateAppointmentInput {
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  title?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @Matches(
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/,
  )
  scheduled_at?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  doctor_name?: string | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  location?: string | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsIn(['Presencial', 'Virtual'])
  modality?: string;
}