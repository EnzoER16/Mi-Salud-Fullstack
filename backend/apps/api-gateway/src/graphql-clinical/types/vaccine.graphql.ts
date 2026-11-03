import { Field, ID, InputType, ObjectType } from '@nestjs/graphql';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

@ObjectType('Vaccine')
export class VaccineObject {
  @Field(() => ID)
  id_vaccine!: string;

  @Field(() => String)
  name!: string;

  @Field(() => String, { nullable: true })
  dose!: string | null;

  @Field(() => String, { nullable: true })
  applied_on!: string | null;

  @Field(() => String, { nullable: true })
  next_dose_on!: string | null;

  @Field(() => String, { nullable: true })
  place!: string | null;

  @Field(() => String, { nullable: true })
  notes!: string | null;
}

@InputType()
export class CreateVaccineInput {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  dose?: string | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  applied_on?: string | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  next_dose_on?: string | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  place?: string | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  notes?: string | null;
}

@InputType()
export class UpdateVaccineInput {
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  dose?: string | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  applied_on?: string | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  next_dose_on?: string | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  place?: string | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  notes?: string | null;
}