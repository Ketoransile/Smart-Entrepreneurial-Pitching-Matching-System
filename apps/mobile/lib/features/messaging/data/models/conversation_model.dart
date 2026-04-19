import '../../domain/entities/conversation_entity.dart';

class ConversationModel extends ConversationEntity {
  const ConversationModel({required super.data});

  factory ConversationModel.fromJson(Map<String, dynamic> json) {
    return ConversationModel(data: json);
  }
}

