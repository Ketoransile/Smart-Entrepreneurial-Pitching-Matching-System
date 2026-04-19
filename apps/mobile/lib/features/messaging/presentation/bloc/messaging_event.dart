part of 'messaging_bloc.dart';

abstract class MessagingEvent extends Equatable {
  const MessagingEvent();
  @override
  List<Object?> get props => [];
}

class ConversationsRequested extends MessagingEvent {
  const ConversationsRequested();
}

class MessagesRequested extends MessagingEvent {
  final String conversationId;
  final int? page;
  final int? limit;
  const MessagesRequested(this.conversationId, {this.page, this.limit});
  @override
  List<Object?> get props => [conversationId, page, limit];
}

class MessageSendRequested extends MessagingEvent {
  final String conversationId;
  final String body;
  const MessageSendRequested({required this.conversationId, required this.body});
  @override
  List<Object?> get props => [conversationId, body];
}

class ConversationReadRequested extends MessagingEvent {
  final String conversationId;
  const ConversationReadRequested(this.conversationId);
  @override
  List<Object?> get props => [conversationId];
}

class UnreadCountRequested extends MessagingEvent {
  const UnreadCountRequested();
}

class NotificationsRequested extends MessagingEvent {
  const NotificationsRequested();
}

class NotificationReadRequested extends MessagingEvent {
  final String notificationId;
  const NotificationReadRequested(this.notificationId);
  @override
  List<Object?> get props => [notificationId];
}

