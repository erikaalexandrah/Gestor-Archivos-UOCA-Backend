import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';

import { User } from './schema/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { Doctor } from 'src/doctors/schema/doctor.schema';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<User>,

    @InjectModel(Doctor.name)
    private readonly doctorModel: Model<Doctor>,

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

    const userPayload = await this.buildUserPayload(user);

    return { user: userPayload, token };
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

    const userPayload = await this.buildUserPayload(user);

    return { user: userPayload, token };
  }

  // /auth/check
  async checkAuthStatus(user: User) {
    const userPayload = await this.buildUserPayload(user as any);
    return { user: userPayload, token: this.getJwtToken(user._id.toString()) };
  }

  private getJwtToken(id: string) {
    return this.jwtService.sign({ id });
  }

  /**
   * Construye el objeto user que se devuelve al front:
   * - quita password
   * - si role === 'doctor', busca el doctor cuyo doctors.username_id (o user_id) === users._id
   *   y agrega doctor_id (y opcionalmente más datos del doctor).
   */
    private async buildUserPayload(userDoc: any) {
    const plainUser =
      typeof userDoc.toObject === 'function' ? userDoc.toObject() : { ...userDoc };

    delete plainUser.password;

    if (plainUser.role !== 'doctor') {
      return plainUser;
    }

    const userIdObj = userDoc._id;
    const userIdStr = String(userDoc._id);

    console.log('[AUTH] Buscando doctor para user', userIdStr);

    const doctor = await this.doctorModel
      .findOne({
        $or: [
          { username_id: userIdObj }, 
          { username_id: userIdStr }, 
          { user_id: userIdObj },
          { user_id: userIdStr },
        ],
      })
      .select('_id full_name cyclhos_name')
      .lean();

    console.log('[AUTH] Doctor encontrado:', doctor);

    if (doctor) {
      return {
        ...plainUser,
        doctor_id: doctor._id.toString(),          
        doctor_full_name: doctor.full_name ?? null,
        doctor_cyclhos_name: doctor.cyclhos_name ?? null,
      };
    }

    return plainUser;
  }

}
