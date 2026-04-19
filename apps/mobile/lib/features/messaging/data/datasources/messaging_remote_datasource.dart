import 'package:dio/dio.dart';

import '../../../../core/config/api_config.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/network/dio_client.dart';
import '../models/conversation_model.dart';
import '../models/message_model.dart';
import '../models/notification_model.dart';

abstract class MessagingRemoteDataSource {
  Future<List<ConversationModel>> listConversations();
  Future<ConversationModel> createOrGetConversation({
    required String otherUserId,
    String? matchResultId,
    String? submissionId,
  });
  Future<List<MessageModel>> listMessages(
    String conversationId, {
    int? page,
    int? limit,
  });
  Future<MessageModel> sendMessage(
    String conversationId, {
    required String body,
    String type,
    String? attachmentUrl,
  });
  Future<void> markConversationRead(String conversationId);

  Future<int> unreadCount();
  Future<List<NotificationModel>> listNotifications();
  Future<void> markNotificationRead(String notificationId);
}

class MessagingRemoteDataSourceImpl implements MessagingRemoteDataSource {
  final DioClient _dio;
  MessagingRemoteDataSourceImpl({required DioClient dioClient}) : _dio = dioClient;

  @override
  Future<List<ConversationModel>> listConversations() async {
    try {
      final res = await _dio.get(ApiConfig.conversations);
      if (res.statusCode == 200) {
        final data = res.data as Map<String, dynamic>;
        final list = (data['conversations'] as List?) ??
            (data['data'] as List?) ??
            const [];
        return list
            .whereType<Map>()
            .map((e) => ConversationModel.fromJson(e.cast<String, dynamic>()))
            .toList();
      }
      throw ServerFailure(message: 'Failed (HTTP ${res.statusCode})');
    } on DioException catch (e) {
      throw ServerFailure(message: e.message ?? 'Failed to load conversations');
    }
  }

  @override
  Future<ConversationModel> createOrGetConversation({
    required String otherUserId,
    String? matchResultId,
    String? submissionId,
  }) async {
    try {
      final res = await _dio.post(
        ApiConfig.conversations,
        data: {
          'otherUserId': otherUserId,
          if (matchResultId != null && matchResultId.isNotEmpty)
            'matchResultId': matchResultId,
          if (submissionId != null && submissionId.isNotEmpty)
            'submissionId': submissionId,
        },
      );
      if (res.statusCode == 200) {
        final data = res.data as Map<String, dynamic>;
        final conv =
            (data['conversation'] as Map?)?.cast<String, dynamic>() ?? data;
        return ConversationModel.fromJson(conv);
      }
      throw ServerFailure(message: 'Failed (HTTP ${res.statusCode})');
    } on DioException catch (e) {
      throw ServerFailure(message: e.message ?? 'Failed to open conversation');
    }
  }

  @override
  Future<List<MessageModel>> listMessages(
    String conversationId, {
    int? page,
    int? limit,
  }) async {
    try {
      final res = await _dio.get(
        ApiConfig.conversationMessages(conversationId),
        queryParameters: {
          if (page != null) 'page': page,
          if (limit != null) 'limit': limit,
        },
      );
      if (res.statusCode == 200) {
        final data = res.data as Map<String, dynamic>;
        final list =
            (data['messages'] as List?) ?? (data['data'] as List?) ?? const [];
        return list
            .whereType<Map>()
            .map((e) => MessageModel.fromJson(e.cast<String, dynamic>()))
            .toList();
      }
      throw ServerFailure(message: 'Failed (HTTP ${res.statusCode})');
    } on DioException catch (e) {
      throw ServerFailure(message: e.message ?? 'Failed to load messages');
    }
  }

  @override
  Future<MessageModel> sendMessage(
    String conversationId, {
    required String body,
    String type = 'text',
    String? attachmentUrl,
  }) async {
    try {
      final res = await _dio.post(
        ApiConfig.conversationMessages(conversationId),
        data: {
          'body': body,
          'type': type,
          if (attachmentUrl != null && attachmentUrl.isNotEmpty)
            'attachmentUrl': attachmentUrl,
        },
      );
      if (res.statusCode == 201 || res.statusCode == 200) {
        final data = res.data as Map<String, dynamic>;
        final msg = (data['message'] as Map?)?.cast<String, dynamic>() ?? data;
        return MessageModel.fromJson(msg);
      }
      throw ServerFailure(message: 'Failed (HTTP ${res.statusCode})');
    } on DioException catch (e) {
      throw ServerFailure(message: e.message ?? 'Failed to send message');
    }
  }

  @override
  Future<void> markConversationRead(String conversationId) async {
    try {
      final res = await _dio.post(ApiConfig.conversationRead(conversationId));
      if (res.statusCode == 200) return;
      throw ServerFailure(message: 'Failed (HTTP ${res.statusCode})');
    } on DioException catch (e) {
      throw ServerFailure(message: e.message ?? 'Failed to mark read');
    }
  }

  @override
  Future<int> unreadCount() async {
    try {
      final res = await _dio.get(ApiConfig.unreadCount);
      if (res.statusCode == 200) {
        final data = res.data as Map<String, dynamic>;
        final v = data['unreadCount'] ?? data['count'] ?? 0;
        if (v is int) return v;
        if (v is num) return v.toInt();
        return 0;
      }
      throw ServerFailure(message: 'Failed (HTTP ${res.statusCode})');
    } on DioException catch (e) {
      throw ServerFailure(message: e.message ?? 'Failed to load unread count');
    }
  }

  @override
  Future<List<NotificationModel>> listNotifications() async {
    try {
      final res = await _dio.get(ApiConfig.notifications);
      if (res.statusCode == 200) {
        final data = res.data as Map<String, dynamic>;
        final list = (data['notifications'] as List?) ??
            (data['data'] as List?) ??
            const [];
        return list
            .whereType<Map>()
            .map((e) => NotificationModel.fromJson(e.cast<String, dynamic>()))
            .toList();
      }
      throw ServerFailure(message: 'Failed (HTTP ${res.statusCode})');
    } on DioException catch (e) {
      throw ServerFailure(message: e.message ?? 'Failed to load notifications');
    }
  }

  @override
  Future<void> markNotificationRead(String notificationId) async {
    try {
      final res = await _dio.patch(ApiConfig.notificationRead(notificationId));
      if (res.statusCode == 200) return;
      throw ServerFailure(message: 'Failed (HTTP ${res.statusCode})');
    } on DioException catch (e) {
      throw ServerFailure(message: e.message ?? 'Failed to mark notification read');
    }
  }
}

