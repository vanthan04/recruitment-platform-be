import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { ConversationController } from '@/modules/chat/presentation/controllers/conversation.controller';
import { MessageController } from '@/modules/chat/presentation/controllers/message.controller';

import { IConversationRepository } from '@/modules/chat/domain/repositories/conversation.repository';
import { ConversationInfraRepository } from '@/modules/chat/infrastructure/repositories/conversation.infra-repository';
import { ConversationPrismaRepository } from '@/modules/chat/infrastructure/persistence/prisma/conversation-prisma.repository';
import { IMessageRepository } from '@/modules/chat/domain/repositories/message.repository';
import { MessageInfraRepository } from '@/modules/chat/infrastructure/repositories/message.infra-repository';
import { MessagePrismaRepository } from '@/modules/chat/infrastructure/persistence/prisma/message-prisma.repository';

import { IChatJobLookupPort } from '@/modules/chat/application/ports/job-lookup.port';
import { ChatJobLookupAdapter } from '@/modules/chat/infrastructure/adapters/job-lookup.adapter';
import { IChatApplicationLookupPort } from '@/modules/chat/application/ports/application-lookup.port';
import { ChatApplicationLookupAdapter } from '@/modules/chat/infrastructure/adapters/application-lookup.adapter';
import { IChatUserLookupPort } from '@/modules/chat/application/ports/user-lookup.port';
import { ChatUserLookupAdapter } from '@/modules/chat/infrastructure/adapters/user-lookup.adapter';
import { IChatNotificationPort } from '@/modules/chat/application/ports/chat-notification.port';
import { ChatNotificationAdapter } from '@/modules/chat/infrastructure/adapters/chat-notification.adapter';

import { JobModule } from '@/modules/job/job.module';
import { UserModule } from '@/modules/user/user.module';
import { JobApplicationModule } from '@/modules/application/job-application.module';
import { NotificationModule } from '@/modules/notification/notification.module';
import { FileUploadModule } from '@/modules/file-upload/file-upload.module';

import { ChatGateway } from '@/modules/chat/infrastructure/gateways/chat.gateway';
import { ChatPresenceService } from '@/modules/chat/infrastructure/services/chat-presence.service';
import { ChatEventsListener } from '@/modules/chat/infrastructure/listeners/chat-events.listener';

import { CreateConversationHandler } from '@/modules/chat/application/commands/create-conversation.command';
import { CreateMessageHandler } from '@/modules/chat/application/commands/create-message.command';
import { EditMessageHandler } from '@/modules/chat/application/commands/edit-message.command';
import { DeleteMessageHandler } from '@/modules/chat/application/commands/delete-message.command';
import { MarkConversationReadHandler } from '@/modules/chat/application/commands/mark-conversation-read.command';
import { ListMyConversationsHandler } from '@/modules/chat/application/queries/list-my-conversations.query';
import { GetConversationHandler } from '@/modules/chat/application/queries/get-conversation.query';
import { ListMessagesHandler } from '@/modules/chat/application/queries/list-messages.query';

@Module({
  imports: [
    CqrsModule,
    JobModule,
    UserModule,
    JobApplicationModule,
    NotificationModule,
    FileUploadModule,
    // The gateway verifies the `access_token` cookie itself (see ws-auth.util.ts) —
    // this JwtModule registration is scoped to Chat, mirroring AuthModule's own
    // (which isn't exported, so it can't be reused directly).
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [ConversationController, MessageController],
  providers: [
    ConversationPrismaRepository,
    MessagePrismaRepository,
    { provide: IConversationRepository, useClass: ConversationInfraRepository },
    { provide: IMessageRepository, useClass: MessageInfraRepository },
    { provide: IChatJobLookupPort, useClass: ChatJobLookupAdapter },
    {
      provide: IChatApplicationLookupPort,
      useClass: ChatApplicationLookupAdapter,
    },
    { provide: IChatUserLookupPort, useClass: ChatUserLookupAdapter },
    { provide: IChatNotificationPort, useClass: ChatNotificationAdapter },

    ChatGateway,
    ChatPresenceService,
    ChatEventsListener,

    CreateConversationHandler,
    CreateMessageHandler,
    EditMessageHandler,
    DeleteMessageHandler,
    MarkConversationReadHandler,
    ListMyConversationsHandler,
    GetConversationHandler,
    ListMessagesHandler,
  ],
})
export class ChatModule {}
