import '../../domain/entities/message_entity.dart';

class MessageModel extends MessageEntity {
  const MessageModel({required super.data});

  factory MessageModel.fromJson(Map<String, dynamic> json) {
    return MessageModel(data: json);
  }
}

