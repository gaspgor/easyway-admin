import { Controller, Get } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { ServiceCenter } from './entities/service-center.entity';

@Controller('admin/dashboard')
export class DashboardController {
  constructor(
    @InjectRepository(User) private usersRepository: Repository<User>,
    @InjectRepository(ServiceCenter) private partnersRepository: Repository<ServiceCenter>,
  ) {}

  @Get('stats')
  async getStatistics() {
    const totalUsers = await this.usersRepository.count();
    const premiumUsers = await this.usersRepository.count({ where: { plan: 'premium' } });
    
    const totalPartners = await this.partnersRepository.count();

    return {
      success: true,
      data: {
        users: { total: totalUsers, premium: premiumUsers },
        partners: { total: totalPartners },
        income: { daily: 0 } // Stubbed until Payments map is added
      }
    };
  }
}
