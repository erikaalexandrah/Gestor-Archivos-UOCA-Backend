import { Controller, Post, Body, Get, UseGuards, Req, UnauthorizedException, Delete, Param, Put, Patch } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { AuthGuard } from '@nestjs/passport';
import { UpdateUserDto } from './dto/update-auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Login usando el mismo DTO
  @Post('login')
  login(@Body() dto: CreateUserDto) {
    return this.authService.login(dto);
  }

  // Test para verificar usuario logueado y token válido
  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  profile(@Req() req) {
    return req.user; // <- viene desde JwtStrategy.validate()
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('create-user')
  async createUserAsAdmin(@Req() req, @Body() dto: CreateUserDto) {
    if (req.user.role !== 'admin') {
      throw new UnauthorizedException('Solo admin puede crear nuevos usuarios');
    }
    return this.authService.create(dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('users')
  async getAllUsers(@Req() req) {
    if (req.user.role !== 'admin') {
      throw new UnauthorizedException('Solo admin puede ver todos los usuarios');
    }
    return this.authService.findAllUsers();
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete('users/:id')
  async deleteUser(@Req() req, @Param('id') id: string) {
    if (req.user.role !== 'admin') {
      throw new UnauthorizedException('Solo un admin puede eliminar usuarios');
    }

    return this.authService.deleteUser(id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('users/:id')
  async updateUser(
    @Req() req,
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ) {
    if (req.user.role !== 'admin') {
      throw new UnauthorizedException('Solo un admin puede actualizar usuarios');
    }

    return this.authService.updateUser(id, dto);
  }
}
