import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { ClientsModule } from './clients/clients.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { EmployeesModule } from './employees/employees.module';
import { MessagesModule } from './messages/messages.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProjectsModule } from './projects/projects.module';
import { ServiceRequestsModule } from './service-requests/service-requests.module';
import { ServicesModule } from './services/services.module';
import { UsersModule } from './users/users.module';
import { StatsModule } from './stats/stats.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsersModule,
    ServicesModule,
    ProjectsModule,
    ServiceRequestsModule,
    ClientsModule,
    EmployeesModule,
    MessagesModule,
    StatsModule,
  ],
  controllers: [AppController],
  providers: [JwtAuthGuard],
})
export class AppModule { }
