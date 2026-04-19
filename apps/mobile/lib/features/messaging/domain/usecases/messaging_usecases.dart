import 'package:dartz/dartz.dart';

import '../../../../core/error/failures.dart';
import '../entities/conversation_entity.dart';
import '../entities/message_entity.dart';
import '../entities/notification_entity.dart';
import '../repositories/messaging_repository.dart';

class ListConversationsUseCase {
  final MessagingRepository _repo;
  ListConversationsUseCase(this._repo);
  Future<Either<Failure, List<ConversationEntity>>> call() => _repo.listConversations();
}

class ListMessagesUseCase {
  final MessagingRepository _repo;
  ListMessagesUseCase(this._repo);
  Future<Either<Failure, List<MessageEntity>>> call(
    String conversationId, {
    int? page,
    int? limit,
  }) =>
      _repo.listMessages(conversationId, page: page, limit: limit);
}

class SendMessageUseCase {
  final MessagingRepository _repo;
  SendMessageUseCase(this._repo);
  Future<Either<Failure, MessageEntity>> call(
    String conversationId, {
    required String body,
  }) =>
      _repo.sendMessage(conversationId, body: body);
}

class MarkConversationReadUseCase {
  final MessagingRepository _repo;
  MarkConversationReadUseCase(this._repo);
  Future<Either<Failure, Unit>> call(String conversationId) =>
      _repo.markConversationRead(conversationId);
}

class UnreadCountUseCase {
  final MessagingRepository _repo;
  UnreadCountUseCase(this._repo);
  Future<Either<Failure, int>> call() => _repo.unreadCount();
}

class ListNotificationsUseCase {
  final MessagingRepository _repo;
  ListNotificationsUseCase(this._repo);
  Future<Either<Failure, List<NotificationEntity>>> call() =>
      _repo.listNotifications();
}

class MarkNotificationReadUseCase {
  final MessagingRepository _repo;
  MarkNotificationReadUseCase(this._repo);
  Future<Either<Failure, Unit>> call(String notificationId) =>
      _repo.markNotificationRead(notificationId);
}

