import { UserService } from '../../../user/application/user.service';
import { RegisterRequestDto } from '../../presentation/dto/register-request.dto';
import { IMailService } from '../../../../common/domain/mail.service.interface';
export declare class RegisterUseCase {
    private readonly userService;
    private readonly mailService;
    constructor(userService: UserService, mailService: IMailService);
    execute(dto: RegisterRequestDto): Promise<{
        message: string;
        data: {
            email: string;
        };
    }>;
}
