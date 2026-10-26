import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { MailService } from './mail.service';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Notification])],
  providers: [NotificationsService, MailService],
  controllers: [NotificationsController],
  exports: [NotificationsService, MailService],
})
export class NotificationsModule {}
