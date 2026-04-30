import 'package:equatable/equatable.dart';

enum MessageType { text, file }

class ReadReceipt extends Equatable {
  final String userId;
  final DateTime readAt;

  const ReadReceipt({
    required this.userId,
    required this.readAt,
  });

  factory ReadReceipt.fromJson(Map<String, dynamic> json) {
    return ReadReceipt(
      userId: (json['userId'] as String?) ?? '',
      readAt: _parseDate(json['readAt']) ?? DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() => {
        'userId': userId,
        'readAt': readAt.toIso8601String(),
      };

  @override
  List<Object?> get props => [userId, readAt];
}

class MessageEntity extends Equatable {
  final String id;
  final String conversationId;
  final String senderId;
  final String body;
  final MessageType type;
  final String? attachmentUrl;
  final List<ReadReceipt> readBy;
  final bool isDeleted;
  final DateTime createdAt;
  final DateTime updatedAt;

  const MessageEntity({
    required this.id,
    required this.conversationId,
    required this.senderId,
    required this.body,
    required this.type,
    this.attachmentUrl,
    required this.readBy,
    required this.isDeleted,
    required this.createdAt,
    required this.updatedAt,
  });

  factory MessageEntity.fromJson(Map<String, dynamic> json) {
    return MessageEntity(
      id: (json['_id'] as String?) ?? (json['id'] as String?) ?? '',
      conversationId: (json['conversationId'] as String?) ?? '',
      senderId: (json['senderId'] as String?) ?? '',
      body: (json['body'] as String?) ?? '',
      type: _parseType(json['type'] as String?),
      attachmentUrl: json['attachmentUrl'] as String?,
      readBy: ((json['readBy'] as List?) ?? [])
          .whereType<Map<String, dynamic>>()
          .map((r) => ReadReceipt.fromJson(r))
          .toList(),
      isDeleted: (json['isDeleted'] as bool?) ?? false,
      createdAt: _parseDate(json['createdAt']) ?? DateTime.now(),
      updatedAt: _parseDate(json['updatedAt']) ?? DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() => {
        '_id': id,
        'conversationId': conversationId,
        'senderId': senderId,
        'body': body,
        'type': _typeToString(type),
        if (attachmentUrl != null) 'attachmentUrl': attachmentUrl,
        'readBy': readBy.map((r) => r.toJson()).toList(),
        'isDeleted': isDeleted,
        'createdAt': createdAt.toIso8601String(),
        'updatedAt': updatedAt.toIso8601String(),
      };

  @override
  List<Object?> get props => [
        id,
        conversationId,
        senderId,
        body,
        type,
        attachmentUrl,
        readBy,
        isDeleted,
        createdAt,
        updatedAt,
      ];
}

MessageType _parseType(String? type) {
  switch (type) {
    case 'text':
      return MessageType.text;
    case 'file':
      return MessageType.file;
    default:
      return MessageType.text;
  }
}

String _typeToString(MessageType type) {
  switch (type) {
    case MessageType.text:
      return 'text';
    case MessageType.file:
      return 'file';
  }
}

DateTime? _parseDate(dynamic value) {
  if (value == null) return null;
  if (value is DateTime) return value;
  if (value is String) return DateTime.tryParse(value);
  return null;
}
