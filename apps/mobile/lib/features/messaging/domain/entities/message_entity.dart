import 'package:equatable/equatable.dart';

class MessageEntity extends Equatable {
  final Map<String, dynamic> data;
  const MessageEntity({required this.data});

  String get id => (data['_id'] as String?) ?? (data['id'] as String?) ?? '';
  String get body => (data['body'] as String?) ?? '';
  String get type => (data['type'] as String?) ?? 'text';
  String get attachmentUrl => (data['attachmentUrl'] as String?) ?? '';
  String get senderId => (data['senderId'] as String?) ?? '';

  DateTime? get createdAt {
    final v = data['createdAt'];
    if (v is String) return DateTime.tryParse(v);
    return null;
  }

  @override
  List<Object?> get props => [data];
}

