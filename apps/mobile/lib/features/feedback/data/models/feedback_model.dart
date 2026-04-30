import '../../domain/entities/feedback_entity.dart';

class FeedbackModel extends FeedbackEntity {
  const FeedbackModel({
    required String id,
    required String? invitationId,
    required String? matchResultId,
    required String? submissionId,
    required String fromUserId,
    required String toUserId,
    required int rating,
    required FeedbackCategory category,
    required String? comment,
    required DateTime createdAt,
    required DateTime updatedAt,
  }) : super(
          id: id,
          invitationId: invitationId,
          matchResultId: matchResultId,
          submissionId: submissionId,
          fromUserId: fromUserId,
          toUserId: toUserId,
          rating: rating,
          category: category,
          comment: comment,
          createdAt: createdAt,
          updatedAt: updatedAt,
        );

  factory FeedbackModel.fromJson(Map<String, dynamic> json) {
    final entity = FeedbackEntity.fromJson(json);
    return FeedbackModel(
      id: entity.id,
      invitationId: entity.invitationId,
      matchResultId: entity.matchResultId,
      submissionId: entity.submissionId,
      fromUserId: entity.fromUserId,
      toUserId: entity.toUserId,
      rating: entity.rating,
      category: entity.category,
      comment: entity.comment,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    );
  }

  factory FeedbackModel.fromEntity(FeedbackEntity entity) {
    return FeedbackModel(
      id: entity.id,
      invitationId: entity.invitationId,
      matchResultId: entity.matchResultId,
      submissionId: entity.submissionId,
      fromUserId: entity.fromUserId,
      toUserId: entity.toUserId,
      rating: entity.rating,
      category: entity.category,
      comment: entity.comment,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    );
  }
}
