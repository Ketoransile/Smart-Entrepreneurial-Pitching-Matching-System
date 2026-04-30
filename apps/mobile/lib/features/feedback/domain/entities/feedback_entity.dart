import 'package:equatable/equatable.dart';

enum FeedbackCategory {
  overall,
  communication,
  professionalism,
  pitchQuality,
  collaboration
}

class FeedbackEntity extends Equatable {
  final String id;
  final String? invitationId;
  final String? matchResultId;
  final String? submissionId;
  final String fromUserId;
  final String toUserId;
  final int rating;
  final FeedbackCategory category;
  final String? comment;
  final DateTime createdAt;
  final DateTime updatedAt;

  const FeedbackEntity({
    required this.id,
    this.invitationId,
    this.matchResultId,
    this.submissionId,
    required this.fromUserId,
    required this.toUserId,
    required this.rating,
    required this.category,
    this.comment,
    required this.createdAt,
    required this.updatedAt,
  });

  factory FeedbackEntity.fromJson(Map<String, dynamic> json) {
    return FeedbackEntity(
      id: (json['_id'] as String?) ?? (json['id'] as String?) ?? '',
      invitationId: json['invitationId'] as String?,
      matchResultId: json['matchResultId'] as String?,
      submissionId: json['submissionId'] as String?,
      fromUserId: (json['fromUserId'] as String?) ?? '',
      toUserId: (json['toUserId'] as String?) ?? '',
      rating: ((json['rating'] as num?) ?? 1).toInt(),
      category: _parseCategory(json['category'] as String?),
      comment: json['comment'] as String?,
      createdAt: _parseDate(json['createdAt']) ?? DateTime.now(),
      updatedAt: _parseDate(json['updatedAt']) ?? DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() => {
        '_id': id,
        if (invitationId != null) 'invitationId': invitationId,
        if (matchResultId != null) 'matchResultId': matchResultId,
        if (submissionId != null) 'submissionId': submissionId,
        'fromUserId': fromUserId,
        'toUserId': toUserId,
        'rating': rating,
        'category': _categoryToString(category),
        if (comment != null) 'comment': comment,
        'createdAt': createdAt.toIso8601String(),
        'updatedAt': updatedAt.toIso8601String(),
      };

  @override
  List<Object?> get props => [
        id,
        invitationId,
        matchResultId,
        submissionId,
        fromUserId,
        toUserId,
        rating,
        category,
        comment,
        createdAt,
        updatedAt,
      ];
}

FeedbackCategory _parseCategory(String? category) {
  switch (category) {
    case 'overall':
      return FeedbackCategory.overall;
    case 'communication':
      return FeedbackCategory.communication;
    case 'professionalism':
      return FeedbackCategory.professionalism;
    case 'pitch_quality':
    case 'pitchQuality':
      return FeedbackCategory.pitchQuality;
    case 'collaboration':
      return FeedbackCategory.collaboration;
    default:
      return FeedbackCategory.overall;
  }
}

String _categoryToString(FeedbackCategory category) {
  switch (category) {
    case FeedbackCategory.overall:
      return 'overall';
    case FeedbackCategory.communication:
      return 'communication';
    case FeedbackCategory.professionalism:
      return 'professionalism';
    case FeedbackCategory.pitchQuality:
      return 'pitch_quality';
    case FeedbackCategory.collaboration:
      return 'collaboration';
  }
}

DateTime? _parseDate(dynamic value) {
  if (value == null) return null;
  if (value is DateTime) return value;
  if (value is String) return DateTime.tryParse(value);
  return null;
}
