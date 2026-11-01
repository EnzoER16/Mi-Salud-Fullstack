import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateEmergencyContactDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  @Matches(/\S/, {
    message: 'El nombre del contacto es obligatorio',
  })
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  relationship?: string | null;

  @IsString()
  @IsNotEmpty()
  @MaxLength(25)
  @Matches(/^(?=(?:\D*\d){6,15}\D*$)[0-9+()\s-]+$/, {
    message: 'El teléfono del contacto no es válido',
  })
  phone!: string;
}