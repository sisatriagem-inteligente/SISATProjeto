import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class AuthService {

  constructor(
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
  ) {}

  async register(data: any) {

    const user = new this.userModel(data);
    return user.save();
  }

  async login(data: any) {
    const user = await this.userModel.findOne({
      cpf: data.cpf,
      password: data.password,
    });

    if (!user) {
      return { error: "Usuário inválido" };
    }

    return { message: "Login feito com sucesso" };
  }

}

