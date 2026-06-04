import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true, collection: 'usuarios' })
export class User {
  @Prop({ required: true })
  cpf!: string;

  @Prop({ required: true })
  password!: string;
}

export const UserSchema = SchemaFactory.createForClass(User);