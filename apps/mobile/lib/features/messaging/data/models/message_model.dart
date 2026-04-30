import '../../domain/entities/message_entity.dart';

class MessageModel extends MessageEntity {
  const MessageModel({
    required String id,
    required String conversationId,
    required String senderId,
    required String body,
    required MessageType type,
    required String? attachmentUrl,
    required List<ReadReceipt> readBy,
    required bool isDeleted,
    required DateTime createdAt,
    required DateTime updatedAt,
  }) : super(
          id: id,
          conversationId: conversationId,
          senderId: senderId,
          body: body,
          type: type,
          attachmentUrl: attachmentUrl,
          readBy: readBy,
          isDeleted: isDeleted,
          createdAt: createdAt,
          updatedAt: updatedAt,
        );

  factory MessageModel.fromJson(Map<String, dynamic> json) {
    final entity = MessageEntity.fromJson(json);
    return MessageModel(
      id: entity.id,
      conversationId: entity.conversationId,
      senderId: entity.senderId,
      body: entity.body,
      type: entity.type,
      attachmentUrl: entity.attachmentUrl,
      readBy: entity.readBy,
      isDeleted: entity.isDeleted,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    );
  }

  factory MessageModel.fromEntity(MessageEntity entity) {
    return MessageModel(
      id: entity.id,
      conversationId: entity.conversationId,
      senderId: entity.senderId,
      body: entity.body,
      type: entity.type,
      attachmentUrl: entity.attachmentUrl,
      readBy: entity.readBy,
      isDeleted: entity.isDeleted,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    );
  }
}
