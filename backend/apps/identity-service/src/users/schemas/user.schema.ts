import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { UserRole } from '@app/contracts';

export type UserDocument = HydratedDocument<User>;

@Schema({
  collection: 'users',
  timestamps: true,
})
export class User {
  @Prop({
    type: String,
    required: true,
    unique: true,
    trim: true,
    maxlength: 50,
  })
  username!: string;

  @Prop({
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  })
  email!: string;

  @Prop({
    type: String,
    required: true,
    select: false,
  })
  passwordHash!: string;

  @Prop({
    type: String,
    required: true,
    enum: Object.values(UserRole),
  })
  role!: UserRole;
}

export const UserSchema = SchemaFactory.createForClass(User);