import 'package:equatable/equatable.dart';

enum MilestoneStatus {
  pending,
  inProgress,
  submittedForReview,
  verifiedPaid,
  rejected,
  cancelled
}

enum MilestoneEscrowStatus { notHeld, held, released, refunded }

class MilestoneEvidenceDocument extends Equatable {
  final String name;
  final String url;
  final String type;
  final DateTime uploadedAt;

  const MilestoneEvidenceDocument({
    required this.name,
    required this.url,
    required this.type,
    required this.uploadedAt,
  });

  factory MilestoneEvidenceDocument.fromJson(Map<String, dynamic> json) {
    return MilestoneEvidenceDocument(
      name: (json['name'] as String?) ?? '',
      url: (json['url'] as String?) ?? '',
      type: (json['type'] as String?) ?? 'other',
      uploadedAt: _parseDate(json['uploadedAt']) ?? DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() => {
        'name': name,
        'url': url,
        'type': type,
        'uploadedAt': uploadedAt.toIso8601String(),
      };

  @override
  List<Object?> get props => [name, url, type, uploadedAt];
}

class MilestoneEntity extends Equatable {
  final String id;
  final String submissionId;
  final String matchResultId;
  final String entrepreneurId;
  final String investorId;
  final String createdBy;
  final String title;
  final String? description;
  final double amount;
  final String currency;
  final DateTime dueDate;
  final List<MilestoneEvidenceDocument> evidenceDocuments;
  final DateTime? submittedAt;
  final DateTime? verifiedAt;
  final String? verifiedBy;
  final String? verificationNotes;
  final MilestoneEscrowStatus escrowStatus;
  final String? escrowReference;
  final DateTime? paymentReleasedAt;
  final String? paymentReference;
  final MilestoneStatus status;
  final String? projectId;
  final String? proof;
  final String? feedback;
  final DateTime createdAt;
  final DateTime updatedAt;

  const MilestoneEntity({
    required this.id,
    required this.submissionId,
    required this.matchResultId,
    required this.entrepreneurId,
    required this.investorId,
    required this.createdBy,
    required this.title,
    this.description,
    required this.amount,
    required this.currency,
    required this.dueDate,
    required this.evidenceDocuments,
    this.submittedAt,
    this.verifiedAt,
    this.verifiedBy,
    this.verificationNotes,
    required this.escrowStatus,
    this.escrowReference,
    this.paymentReleasedAt,
    this.paymentReference,
    required this.status,
    this.projectId,
    this.proof,
    this.feedback,
    required this.createdAt,
    required this.updatedAt,
  });

  factory MilestoneEntity.fromJson(Map<String, dynamic> json) {
    return MilestoneEntity(
      id: (json['_id'] as String?) ?? (json['id'] as String?) ?? '',
      submissionId: (json['submissionId'] as String?) ?? '',
      matchResultId: (json['matchResultId'] as String?) ?? '',
      entrepreneurId: (json['entrepreneurId'] as String?) ?? '',
      investorId: (json['investorId'] as String?) ?? '',
      createdBy: (json['createdBy'] as String?) ?? '',
      title: (json['title'] as String?) ?? '',
      description: json['description'] as String?,
      amount: ((json['amount'] as num?) ?? 0).toDouble(),
      currency: (json['currency'] as String?) ?? 'ETB',
      dueDate: _parseDate(json['dueDate']) ?? DateTime.now(),
      evidenceDocuments: ((json['evidenceDocuments'] as List?) ?? [])
          .whereType<Map<String, dynamic>>()
          .map((doc) => MilestoneEvidenceDocument.fromJson(doc))
          .toList(),
      submittedAt: _parseDate(json['submittedAt']),
      verifiedAt: _parseDate(json['verifiedAt']),
      verifiedBy: json['verifiedBy'] as String?,
      verificationNotes: json['verificationNotes'] as String?,
      escrowStatus: _parseEscrowStatus(json['escrowStatus'] as String?),
      escrowReference: json['escrowReference'] as String?,
      paymentReleasedAt: _parseDate(json['paymentReleasedAt']),
      paymentReference: json['paymentReference'] as String?,
      status: _parseStatus(json['status'] as String?),
      projectId: json['projectId'] as String?,
      proof: json['proof'] as String?,
      feedback: json['feedback'] as String?,
      createdAt: _parseDate(json['createdAt']) ?? DateTime.now(),
      updatedAt: _parseDate(json['updatedAt']) ?? DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() => {
        '_id': id,
        'submissionId': submissionId,
        'matchResultId': matchResultId,
        'entrepreneurId': entrepreneurId,
        'investorId': investorId,
        'createdBy': createdBy,
        'title': title,
        if (description != null) 'description': description,
        'amount': amount,
        'currency': currency,
        'dueDate': dueDate.toIso8601String(),
        'evidenceDocuments': evidenceDocuments.map((d) => d.toJson()).toList(),
        if (submittedAt != null) 'submittedAt': submittedAt?.toIso8601String(),
        if (verifiedAt != null) 'verifiedAt': verifiedAt?.toIso8601String(),
        if (verifiedBy != null) 'verifiedBy': verifiedBy,
        if (verificationNotes != null) 'verificationNotes': verificationNotes,
        'escrowStatus': _escrowStatusToString(escrowStatus),
        if (escrowReference != null) 'escrowReference': escrowReference,
        if (paymentReleasedAt != null)
          'paymentReleasedAt': paymentReleasedAt?.toIso8601String(),
        if (paymentReference != null) 'paymentReference': paymentReference,
        'status': _statusToString(status),
        if (projectId != null) 'projectId': projectId,
        if (proof != null) 'proof': proof,
        if (feedback != null) 'feedback': feedback,
        'createdAt': createdAt.toIso8601String(),
        'updatedAt': updatedAt.toIso8601String(),
      };

  @override
  List<Object?> get props => [
        id,
        submissionId,
        matchResultId,
        entrepreneurId,
        investorId,
        createdBy,
        title,
        description,
        amount,
        currency,
        dueDate,
        evidenceDocuments,
        submittedAt,
        verifiedAt,
        verifiedBy,
        verificationNotes,
        escrowStatus,
        escrowReference,
        paymentReleasedAt,
        paymentReference,
        status,
        projectId,
        proof,
        feedback,
        createdAt,
        updatedAt,
      ];
}

MilestoneStatus _parseStatus(String? status) {
  switch (status) {
    case 'pending':
      return MilestoneStatus.pending;
    case 'in_progress':
    case 'inProgress':
      return MilestoneStatus.inProgress;
    case 'submitted_for_review':
    case 'submittedForReview':
      return MilestoneStatus.submittedForReview;
    case 'verified_paid':
    case 'verifiedPaid':
      return MilestoneStatus.verifiedPaid;
    case 'rejected':
      return MilestoneStatus.rejected;
    case 'cancelled':
      return MilestoneStatus.cancelled;
    default:
      return MilestoneStatus.pending;
  }
}

MilestoneEscrowStatus _parseEscrowStatus(String? status) {
  switch (status) {
    case 'not_held':
    case 'notHeld':
      return MilestoneEscrowStatus.notHeld;
    case 'held':
      return MilestoneEscrowStatus.held;
    case 'released':
      return MilestoneEscrowStatus.released;
    case 'refunded':
      return MilestoneEscrowStatus.refunded;
    default:
      return MilestoneEscrowStatus.notHeld;
  }
}

String _statusToString(MilestoneStatus status) {
  switch (status) {
    case MilestoneStatus.pending:
      return 'pending';
    case MilestoneStatus.inProgress:
      return 'in_progress';
    case MilestoneStatus.submittedForReview:
      return 'submitted_for_review';
    case MilestoneStatus.verifiedPaid:
      return 'verified_paid';
    case MilestoneStatus.rejected:
      return 'rejected';
    case MilestoneStatus.cancelled:
      return 'cancelled';
  }
}

String _escrowStatusToString(MilestoneEscrowStatus status) {
  switch (status) {
    case MilestoneEscrowStatus.notHeld:
      return 'not_held';
    case MilestoneEscrowStatus.held:
      return 'held';
    case MilestoneEscrowStatus.released:
      return 'released';
    case MilestoneEscrowStatus.refunded:
      return 'refunded';
  }
}

DateTime? _parseDate(dynamic value) {
  if (value == null) return null;
  if (value is DateTime) return value;
  if (value is String) return DateTime.tryParse(value);
  return null;
}
