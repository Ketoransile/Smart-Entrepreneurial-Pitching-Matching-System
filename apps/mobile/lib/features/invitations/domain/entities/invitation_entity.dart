import 'package:equatable/equatable.dart';

enum InvitationStatus { pending, accepted, declined, cancelled, expired }

class InvitationEntity extends Equatable {
  final String id;
  final String matchResultId;
  final String? submissionId;
  final String entrepreneurId;
  final String investorId;
  final String senderId;
  final String receiverId;
  final String? message;
  final String? responseMessage;
  final InvitationStatus status;
  final DateTime sentAt;
  final DateTime? respondedAt;
  final DateTime expiresAt;
  final DateTime createdAt;
  final DateTime updatedAt;

  const InvitationEntity({
    required this.id,
    required this.matchResultId,
    this.submissionId,
    required this.entrepreneurId,
    required this.investorId,
    required this.senderId,
    required this.receiverId,
    this.message,
    this.responseMessage,
    required this.status,
    required this.sentAt,
    this.respondedAt,
    required this.expiresAt,
    required this.createdAt,
    required this.updatedAt,
  });

  factory InvitationEntity.fromJson(Map<String, dynamic> json) {
    return InvitationEntity(
      id: (json['_id'] as String?) ?? (json['id'] as String?) ?? '',
      matchResultId: (json['matchResultId'] as String?) ?? '',
      submissionId: json['submissionId'] as String?,
      entrepreneurId: (json['entrepreneurId'] as String?) ?? '',
      investorId: (json['investorId'] as String?) ?? '',
      senderId: (json['senderId'] as String?) ?? '',
      receiverId: (json['receiverId'] as String?) ?? '',
      message: json['message'] as String?,
      responseMessage: json['responseMessage'] as String?,
      status: _parseStatus(json['status'] as String?),
      sentAt: _parseDate(json['sentAt']) ?? DateTime.now(),
      respondedAt: _parseDate(json['respondedAt']),
      expiresAt: _parseDate(json['expiresAt']) ??
          DateTime.now().add(Duration(days: 14)),
      createdAt: _parseDate(json['createdAt']) ?? DateTime.now(),
      updatedAt: _parseDate(json['updatedAt']) ?? DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() => {
        '_id': id,
        'matchResultId': matchResultId,
        if (submissionId != null) 'submissionId': submissionId,
        'entrepreneurId': entrepreneurId,
        'investorId': investorId,
        'senderId': senderId,
        'receiverId': receiverId,
        if (message != null) 'message': message,
        if (responseMessage != null) 'responseMessage': responseMessage,
        'status': _statusToString(status),
        'sentAt': sentAt.toIso8601String(),
        if (respondedAt != null) 'respondedAt': respondedAt?.toIso8601String(),
        'expiresAt': expiresAt.toIso8601String(),
        'createdAt': createdAt.toIso8601String(),
        'updatedAt': updatedAt.toIso8601String(),
      };

  @override
  List<Object?> get props => [
        id,
        matchResultId,
        submissionId,
        entrepreneurId,
        investorId,
        senderId,
        receiverId,
        message,
        responseMessage,
        status,
        sentAt,
        respondedAt,
        expiresAt,
        createdAt,
        updatedAt,
      ];
}

InvitationStatus _parseStatus(String? status) {
  switch (status) {
    case 'pending':
      return InvitationStatus.pending;
    case 'accepted':
      return InvitationStatus.accepted;
    case 'declined':
      return InvitationStatus.declined;
    case 'cancelled':
      return InvitationStatus.cancelled;
    case 'expired':
      return InvitationStatus.expired;
    default:
      return InvitationStatus.pending;
  }
}

String _statusToString(InvitationStatus status) {
  switch (status) {
    case InvitationStatus.pending:
      return 'pending';
    case InvitationStatus.accepted:
      return 'accepted';
    case InvitationStatus.declined:
      return 'declined';
    case InvitationStatus.cancelled:
      return 'cancelled';
    case InvitationStatus.expired:
      return 'expired';
  }
}

DateTime? _parseDate(dynamic value) {
  if (value == null) return null;
  if (value is DateTime) return value;
  if (value is String) return DateTime.tryParse(value);
  return null;
}
