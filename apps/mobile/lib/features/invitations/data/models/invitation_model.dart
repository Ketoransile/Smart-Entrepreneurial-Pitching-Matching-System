import '../../domain/entities/invitation_entity.dart';

class InvitationModel extends InvitationEntity {
  const InvitationModel({
    required String id,
    required String matchResultId,
    required String? submissionId,
    required String entrepreneurId,
    required String investorId,
    required String senderId,
    required String receiverId,
    required String? message,
    required String? responseMessage,
    required InvitationStatus status,
    required DateTime sentAt,
    required DateTime? respondedAt,
    required DateTime expiresAt,
    required DateTime createdAt,
    required DateTime updatedAt,
  }) : super(
          id: id,
          matchResultId: matchResultId,
          submissionId: submissionId,
          entrepreneurId: entrepreneurId,
          investorId: investorId,
          senderId: senderId,
          receiverId: receiverId,
          message: message,
          responseMessage: responseMessage,
          status: status,
          sentAt: sentAt,
          respondedAt: respondedAt,
          expiresAt: expiresAt,
          createdAt: createdAt,
          updatedAt: updatedAt,
        );

  factory InvitationModel.fromJson(Map<String, dynamic> json) {
    final entity = InvitationEntity.fromJson(json);
    return InvitationModel(
      id: entity.id,
      matchResultId: entity.matchResultId,
      submissionId: entity.submissionId,
      entrepreneurId: entity.entrepreneurId,
      investorId: entity.investorId,
      senderId: entity.senderId,
      receiverId: entity.receiverId,
      message: entity.message,
      responseMessage: entity.responseMessage,
      status: entity.status,
      sentAt: entity.sentAt,
      respondedAt: entity.respondedAt,
      expiresAt: entity.expiresAt,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    );
  }

  factory InvitationModel.fromEntity(InvitationEntity entity) {
    return InvitationModel(
      id: entity.id,
      matchResultId: entity.matchResultId,
      submissionId: entity.submissionId,
      entrepreneurId: entity.entrepreneurId,
      investorId: entity.investorId,
      senderId: entity.senderId,
      receiverId: entity.receiverId,
      message: entity.message,
      responseMessage: entity.responseMessage,
      status: entity.status,
      sentAt: entity.sentAt,
      respondedAt: entity.respondedAt,
      expiresAt: entity.expiresAt,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    );
  }
}
