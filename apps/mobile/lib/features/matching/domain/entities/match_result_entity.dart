import 'package:equatable/equatable.dart';

enum MatchStatus { pending, requested, accepted, declined, expired }

class ScoreBreakdown extends Equatable {
  final double sector;
  final double stage;
  final double budget;
  final double embedding;

  const ScoreBreakdown({
    required this.sector,
    required this.stage,
    required this.budget,
    required this.embedding,
  });

  factory ScoreBreakdown.fromJson(Map<String, dynamic>? json) {
    if (json == null) {
      return const ScoreBreakdown(sector: 0, stage: 0, budget: 0, embedding: 0);
    }
    return ScoreBreakdown(
      sector: ((json['sector'] as num?) ?? 0).toDouble(),
      stage: ((json['stage'] as num?) ?? 0).toDouble(),
      budget: ((json['budget'] as num?) ?? 0).toDouble(),
      embedding: ((json['embedding'] as num?) ?? 0).toDouble(),
    );
  }

  Map<String, dynamic> toJson() => {
        'sector': sector,
        'stage': stage,
        'budget': budget,
        'embedding': embedding,
      };

  @override
  List<Object?> get props => [sector, stage, budget, embedding];
}

class MatchResultEntity extends Equatable {
  final String id;
  final String submissionId;
  final String entrepreneurId;
  final String investorId;
  final double score;
  final int? rank;
  final String? aiRationale;
  final ScoreBreakdown scoreBreakdown;
  final MatchStatus status;
  final DateTime matchedAt;
  final DateTime? expiresAt;
  final DateTime createdAt;
  final DateTime updatedAt;

  const MatchResultEntity({
    required this.id,
    required this.submissionId,
    required this.entrepreneurId,
    required this.investorId,
    required this.score,
    this.rank,
    this.aiRationale,
    required this.scoreBreakdown,
    required this.status,
    required this.matchedAt,
    this.expiresAt,
    required this.createdAt,
    required this.updatedAt,
  });

  factory MatchResultEntity.fromJson(Map<String, dynamic> json) {
    return MatchResultEntity(
      id: (json['_id'] as String?) ?? (json['id'] as String?) ?? '',
      submissionId: (json['submissionId'] as String?) ?? '',
      entrepreneurId: (json['entrepreneurId'] as String?) ?? '',
      investorId: (json['investorId'] as String?) ?? '',
      score: ((json['score'] as num?) ?? 0).toDouble(),
      rank: (json['rank'] as int?),
      aiRationale: json['aiRationale'] as String?,
      scoreBreakdown: ScoreBreakdown.fromJson(
          json['scoreBreakdown'] as Map<String, dynamic>?),
      status: _parseStatus(json['status'] as String?),
      matchedAt: _parseDate(json['matchedAt']) ?? DateTime.now(),
      expiresAt: _parseDate(json['expiresAt']),
      createdAt: _parseDate(json['createdAt']) ?? DateTime.now(),
      updatedAt: _parseDate(json['updatedAt']) ?? DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() => {
        '_id': id,
        'submissionId': submissionId,
        'entrepreneurId': entrepreneurId,
        'investorId': investorId,
        'score': score,
        if (rank != null) 'rank': rank,
        if (aiRationale != null) 'aiRationale': aiRationale,
        'scoreBreakdown': scoreBreakdown.toJson(),
        'status': _statusToString(status),
        'matchedAt': matchedAt.toIso8601String(),
        if (expiresAt != null) 'expiresAt': expiresAt?.toIso8601String(),
        'createdAt': createdAt.toIso8601String(),
        'updatedAt': updatedAt.toIso8601String(),
      };

  @override
  List<Object?> get props => [
        id,
        submissionId,
        entrepreneurId,
        investorId,
        score,
        rank,
        aiRationale,
        scoreBreakdown,
        status,
        matchedAt,
        expiresAt,
        createdAt,
        updatedAt,
      ];
}

MatchStatus _parseStatus(String? status) {
  switch (status) {
    case 'pending':
      return MatchStatus.pending;
    case 'requested':
      return MatchStatus.requested;
    case 'accepted':
      return MatchStatus.accepted;
    case 'declined':
      return MatchStatus.declined;
    case 'expired':
      return MatchStatus.expired;
    default:
      return MatchStatus.pending;
  }
}

String _statusToString(MatchStatus status) {
  switch (status) {
    case MatchStatus.pending:
      return 'pending';
    case MatchStatus.requested:
      return 'requested';
    case MatchStatus.accepted:
      return 'accepted';
    case MatchStatus.declined:
      return 'declined';
    case MatchStatus.expired:
      return 'expired';
  }
}

DateTime? _parseDate(dynamic value) {
  if (value == null) return null;
  if (value is DateTime) return value;
  if (value is String) return DateTime.tryParse(value);
  return null;
}
