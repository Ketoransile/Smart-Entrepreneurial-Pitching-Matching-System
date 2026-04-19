import 'package:dartz/dartz.dart';

import '../../../../core/error/failures.dart';
import '../../domain/entities/conversation_entity.dart';
import '../../domain/entities/message_entity.dart';
import '../../domain/entities/notification_entity.dart';
import '../../domain/repositories/messaging_repository.dart';
import '../datasources/messaging_remote_datasource.dart';

class MessagingRepositoryImpl implements MessagingRepository {
  final MessagingRemoteDataSource _remote;
  MessagingRepositoryImpl({required MessagingRemoteDataSource remote}) : _remote = remote;

  @override
  Future<Either<Failure, List<ConversationEntity>>> listConversations() async {
    try {
      final list = await _remote.listConversations();
      return Right(list);
    } on Failure catch (e) {
      return Left(e);
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, ConversationEntity>> createOrGetConversation({
    required String otherUserId,
    String? matchResultId,
    String? submissionId,
  }) async {
    try {
      final conv = await _remote.createOrGetConversation(
        otherUserId: otherUserId,
        matchResultId: matchResultId,
        submissionId: submissionId,
      );
      return Right(conv);
    } on Failure catch (e) {
      return Left(e);
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, List<MessageEntity>>> listMessages(
    String conversationId, {
    int? page,
    int? limit,
  }) async {
    try {
      final list = await _remote.listMessages(conversationId, page: page, limit: limit);
      return Right(list);
    } on Failure catch (e) {
      return Left(e);
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, MessageEntity>> sendMessage(
    String conversationId, {
    required String body,
    String type = 'text',
    String? attachmentUrl,
  }) async {
    try {
      final msg = await _remote.sendMessage(
        conversationId,
        body: body,
        type: type,
        attachmentUrl: attachmentUrl,
      );
      return Right(msg);
    } on Failure catch (e) {
      return Left(e);
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, Unit>> markConversationRead(String conversationId) async {
    try {
      await _remote.markConversationRead(conversationId);
      return const Right(unit);
    } on Failure catch (e) {
      return Left(e);
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, int>> unreadCount() async {
    try {
      final count = await _remote.unreadCount();
      return Right(count);
    } on Failure catch (e) {
      return Left(e);
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, List<NotificationEntity>>> listNotifications() async {
    try {
      final list = await _remote.listNotifications();
      return Right(list);
    } on Failure catch (e) {
      return Left(e);
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, Unit>> markNotificationRead(String notificationId) async {
    try {
      await _remote.markNotificationRead(notificationId);
      return const Right(unit);
    } on Failure catch (e) {
      return Left(e);
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }
}

