part of 'messaging_bloc.dart';

enum MessagingStatus {
  initial,
  loading,
  conversationsLoaded,
  messagesLoaded,
  notificationsLoaded,
  error,
}

class MessagingState extends Equatable {
  final MessagingStatus status;
  final List<ConversationEntity> conversations;
  final String? conversationId;
  final List<MessageEntity> messages;
  final List<NotificationEntity> notifications;
  final int unreadCount;
  final String? error;

  const MessagingState({
    required this.status,
    this.conversations = const [],
    this.conversationId,
    this.messages = const [],
    this.notifications = const [],
    this.unreadCount = 0,
    this.error,
  });

  const MessagingState.initial()
      : status = MessagingStatus.initial,
        conversations = const [],
        conversationId = null,
        messages = const [],
        notifications = const [],
        unreadCount = 0,
        error = null;

  MessagingState copyWith({
    MessagingStatus? status,
    List<ConversationEntity>? conversations,
    String? conversationId,
    List<MessageEntity>? messages,
    List<NotificationEntity>? notifications,
    int? unreadCount,
    String? error,
  }) {
    return MessagingState(
      status: status ?? this.status,
      conversations: conversations ?? this.conversations,
      conversationId: conversationId ?? this.conversationId,
      messages: messages ?? this.messages,
      notifications: notifications ?? this.notifications,
      unreadCount: unreadCount ?? this.unreadCount,
      error: error,
    );
  }

  bool get isLoading => status == MessagingStatus.loading;

  @override
  List<Object?> get props => [
        status,
        conversations,
        conversationId,
        messages,
        notifications,
        unreadCount,
        error,
      ];
}

