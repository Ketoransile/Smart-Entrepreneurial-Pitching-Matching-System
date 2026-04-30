import '../../domain/entities/match_result_entity.dart';

class MatchResultModel extends MatchResultEntity {
  const MatchResultModel({
    required String id,
    required String submissionId,
    required String entrepreneurId,
    required String investorId,
    required double score,
    required int? rank,
    required String? aiRationale,
    required ScoreBreakdown scoreBreakdown,
    required MatchStatus status,
    required DateTime matchedAt,
    required DateTime? expiresAt,
    required DateTime createdAt,
    required DateTime updatedAt,
  }) : super(
          id: id,
          submissionId: submissionId,
          entrepreneurId: entrepreneurId,
          investorId: investorId,
          score: score,
          rank: rank,
          aiRationale: aiRationale,
          scoreBreakdown: scoreBreakdown,
          status: status,
          matchedAt: matchedAt,
          expiresAt: expiresAt,
          createdAt: createdAt,
          updatedAt: updatedAt,
        );

  factory MatchResultModel.fromJson(Map<String, dynamic> json) {
    final entity = MatchResultEntity.fromJson(json);
    return MatchResultModel(
      id: entity.id,
      submissionId: entity.submissionId,
      entrepreneurId: entity.entrepreneurId,
      investorId: entity.investorId,
      score: entity.score,
      rank: entity.rank,
      aiRationale: entity.aiRationale,
      scoreBreakdown: entity.scoreBreakdown,
      status: entity.status,
      matchedAt: entity.matchedAt,
      expiresAt: entity.expiresAt,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    );
  }

  factory MatchResultModel.fromEntity(MatchResultEntity entity) {
    return MatchResultModel(
      id: entity.id,
      submissionId: entity.submissionId,
      entrepreneurId: entity.entrepreneurId,
      investorId: entity.investorId,
      score: entity.score,
      rank: entity.rank,
      aiRationale: entity.aiRationale,
      scoreBreakdown: entity.scoreBreakdown,
      status: entity.status,
      matchedAt: entity.matchedAt,
      expiresAt: entity.expiresAt,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    );
  }
}
