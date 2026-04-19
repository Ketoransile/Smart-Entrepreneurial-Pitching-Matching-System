import 'package:equatable/equatable.dart';

class ConversationEntity extends Equatable {
  final Map<String, dynamic> data;
  const ConversationEntity({required this.data});

  String get id => (data['_id'] as String?) ?? (data['id'] as String?) ?? '';

  List<String> get participants =>
      (data['participants'] as List?)?.whereType<String>().toList() ?? const [];

  String get otherUserName =>
      (data['otherUserName'] as String?) ??
      (data['otherUser'] is Map ? (data['otherUser']['fullName'] as String?) : null) ??
      '';

  int get unreadCount => (data['unreadCount'] as int?) ?? 0;

  @override
  List<Object?> get props => [data];
}

