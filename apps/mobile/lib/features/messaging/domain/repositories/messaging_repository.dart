import 'package:dartz/dartz.dart';

import '../../../../core/error/failures.dart';
import '../entities/conversation_entity.dart';
import '../entities/message_entity.dart';
import '../entities/notification_entity.dart';

abstract class MessagingRepository {
  Future<Either<Failure, List<ConversationEntity>>> listConversations();
  Future<Either<Failure, ConversationEntity>> createOrGetConversation({
    required String otherUserId,
    String? matchResultId,
    String? submissionId,
  });
  Future<Either<Failure, List<MessageEntity>>> listMessages(
    String conversationId, {
    int? page,
    int? limit,
  });
  Future<Either<Failure, MessageEntity>> sendMessage(
    String conversationId, {
    required String body,
    String type,
    String? attachmentUrl,
  });
  Future<Either<Failure, Unit>> markConversationRead(String conversationId);

  Future<Either<Failure, int>> unreadCount();
  Future<Either<Failure, List<NotificationEntity>>> listNotifications();
  Future<Either<Failure, Unit>> markNotificationRead(String notificationId);
}

