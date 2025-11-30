import { IsString, IsNotEmpty } from 'class-validator';

export class UpdateDoctorUsernameDto {
  @IsString()
  @IsNotEmpty()
  username_id: string;
}
