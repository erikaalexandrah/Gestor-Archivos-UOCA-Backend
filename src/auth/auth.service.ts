import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';

import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
    private readonly jwtService: JwtService,
  ) {}

  // Registro
  async create(dto: CreateUserDto) {
    const { username, password, role } = dto;

    const exists = await this.userModel.findOne({ username });
    if (exists) throw new BadRequestException('El usuario ya existe');

    const user = await this.userModel.create({
      username,
      password,
      role: role || 'technician', // valor por defecto
    });

    const token = this.getJwtToken(user._id.toString());
    return { user, token };
  }

  // Login
  async login(dto: CreateUserDto) {
    const { username, password } = dto;

    const user = await this.userModel
      .findOne({ username })
      .select('+password');

    if (!user) throw new UnauthorizedException('Credenciales inválidas');

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword)
      throw new UnauthorizedException('Credenciales inválidas');

    const token = this.getJwtToken(user._id.toString());
    user.password = undefined;

    return { user, token };
  }

  checkAuthStatus(user: User) {
    return { user, token: this.getJwtToken(user._id.toString()) };
  }

  private getJwtToken(id: string) {
    return this.jwtService.sign({ id });
  }
}
