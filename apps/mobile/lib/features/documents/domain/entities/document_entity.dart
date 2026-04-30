import 'package:equatable/equatable.dart';

enum DocumentType {
  pitchDeck,
  financialModel,
  productDemo,
  customerTestimonials,
  other
}

enum DocumentProcessingStatus {
  uploaded,
  processing,
  processed,
  failed,
  flagged
}

class DocumentEntity extends Equatable {
  final String id;
  final String ownerId;
  final String? submissionId;
  final DocumentType type;
  final String filename;
  final String cloudinaryPublicId;
  final String url;
  final int sizeBytes;
  final String mimeType;
  final DocumentProcessingStatus status;
  final String? extractedText;
  final String? aiSummary;
  final List<String> aiTags;
  final double? aiConfidence;
  final String? processingError;
  final DateTime? processedAt;
  final DateTime createdAt;
  final DateTime updatedAt;

  const DocumentEntity({
    required this.id,
    required this.ownerId,
    this.submissionId,
    required this.type,
    required this.filename,
    required this.cloudinaryPublicId,
    required this.url,
    required this.sizeBytes,
    required this.mimeType,
    required this.status,
    this.extractedText,
    this.aiSummary,
    required this.aiTags,
    this.aiConfidence,
    this.processingError,
    this.processedAt,
    required this.createdAt,
    required this.updatedAt,
  });

  factory DocumentEntity.fromJson(Map<String, dynamic> json) {
    return DocumentEntity(
      id: (json['_id'] as String?) ?? (json['id'] as String?) ?? '',
      ownerId: (json['ownerId'] as String?) ?? '',
      submissionId: json['submissionId'] as String?,
      type: _parseType(json['type'] as String?),
      filename: (json['filename'] as String?) ?? '',
      cloudinaryPublicId: (json['cloudinaryPublicId'] as String?) ?? '',
      url: (json['url'] as String?) ?? '',
      sizeBytes: ((json['sizeBytes'] as num?) ?? 0).toInt(),
      mimeType: (json['mimeType'] as String?) ?? '',
      status: _parseStatus(json['status'] as String?),
      extractedText: json['extractedText'] as String?,
      aiSummary: json['aiSummary'] as String?,
      aiTags: ((json['aiTags'] as List?) ?? []).whereType<String>().toList(),
      aiConfidence: (json['aiConfidence'] as num?)?.toDouble(),
      processingError: json['processingError'] as String?,
      processedAt: _parseDate(json['processedAt']),
      createdAt: _parseDate(json['createdAt']) ?? DateTime.now(),
      updatedAt: _parseDate(json['updatedAt']) ?? DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() => {
        '_id': id,
        'ownerId': ownerId,
        if (submissionId != null) 'submissionId': submissionId,
        'type': _typeToString(type),
        'filename': filename,
        'cloudinaryPublicId': cloudinaryPublicId,
        'url': url,
        'sizeBytes': sizeBytes,
        'mimeType': mimeType,
        'status': _statusToString(status),
        if (extractedText != null) 'extractedText': extractedText,
        if (aiSummary != null) 'aiSummary': aiSummary,
        'aiTags': aiTags,
        if (aiConfidence != null) 'aiConfidence': aiConfidence,
        if (processingError != null) 'processingError': processingError,
        if (processedAt != null) 'processedAt': processedAt?.toIso8601String(),
        'createdAt': createdAt.toIso8601String(),
        'updatedAt': updatedAt.toIso8601String(),
      };

  @override
  List<Object?> get props => [
        id,
        ownerId,
        submissionId,
        type,
        filename,
        cloudinaryPublicId,
        url,
        sizeBytes,
        mimeType,
        status,
        extractedText,
        aiSummary,
        aiTags,
        aiConfidence,
        processingError,
        processedAt,
        createdAt,
        updatedAt,
      ];
}

DocumentType _parseType(String? type) {
  switch (type) {
    case 'pitch_deck':
    case 'pitchDeck':
      return DocumentType.pitchDeck;
    case 'financial_model':
    case 'financialModel':
      return DocumentType.financialModel;
    case 'product_demo':
    case 'productDemo':
      return DocumentType.productDemo;
    case 'customer_testimonials':
    case 'customerTestimonials':
      return DocumentType.customerTestimonials;
    default:
      return DocumentType.other;
  }
}

DocumentProcessingStatus _parseStatus(String? status) {
  switch (status) {
    case 'uploaded':
      return DocumentProcessingStatus.uploaded;
    case 'processing':
      return DocumentProcessingStatus.processing;
    case 'processed':
      return DocumentProcessingStatus.processed;
    case 'failed':
      return DocumentProcessingStatus.failed;
    case 'flagged':
      return DocumentProcessingStatus.flagged;
    default:
      return DocumentProcessingStatus.uploaded;
  }
}

String _typeToString(DocumentType type) {
  switch (type) {
    case DocumentType.pitchDeck:
      return 'pitch_deck';
    case DocumentType.financialModel:
      return 'financial_model';
    case DocumentType.productDemo:
      return 'product_demo';
    case DocumentType.customerTestimonials:
      return 'customer_testimonials';
    case DocumentType.other:
      return 'other';
  }
}

String _statusToString(DocumentProcessingStatus status) {
  switch (status) {
    case DocumentProcessingStatus.uploaded:
      return 'uploaded';
    case DocumentProcessingStatus.processing:
      return 'processing';
    case DocumentProcessingStatus.processed:
      return 'processed';
    case DocumentProcessingStatus.failed:
      return 'failed';
    case DocumentProcessingStatus.flagged:
      return 'flagged';
  }
}

DateTime? _parseDate(dynamic value) {
  if (value == null) return null;
  if (value is DateTime) return value;
  if (value is String) return DateTime.tryParse(value);
  return null;
}
