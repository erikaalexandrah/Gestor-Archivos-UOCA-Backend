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
    const { username, password } = dto;

    // Verifica si ya existe el usuario
    const exists = await this.userModel.findOne({ username });
    if (exists) throw new BadRequestException('El usuario ya existe');

    // Crea usuario (el hash se aplica con el .pre('save'))
    const user = await this.userModel.create({ username, password });

    // Genera token
    const token = this.getJwtToken(user._id.toString());

    // No devolver password
    user.password = undefined;

    return { user, token };
  }

  // Login
  async login(dto: CreateUserDto) {
    const { username, password } = dto;

    // Busca el usuario y fuerza traer el password
    const user = await this.userModel
      .findOne({ username })
      .select('+password');

    if (!user) throw new UnauthorizedException('Credenciales inválidas');

    // Compara contraseñas
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword)
      throw new UnauthorizedException('Credenciales inválidas');

    // Genera token
    const token = this.getJwtToken(user._id.toString());

    // No devolver password
    user.password = undefined;

    return { user, token };
  }

  // Devuelve usuario + token (para /auth/profile)
  checkAuthStatus(user: User) {
    return { user, token: this.getJwtToken(user._id.toString()) };
  }

  private getJwtToken(id: string) {
    return this.jwtService.sign({ id });
  }
}

