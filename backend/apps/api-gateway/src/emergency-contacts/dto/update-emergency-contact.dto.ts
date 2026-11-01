import {
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class UpdateEmergencyContactDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  @Matches(/\S/, {
    message: 'El nombre del contacto no puede estar vacío',
  })
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  relationship?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(25)
  @Matches(/^(?=(?:\D*\d){6,15}\D*$)[0-9+()\s-]+$/, {
    message: 'El teléfono del contacto no es válido',
  })
  phone?: string;
}