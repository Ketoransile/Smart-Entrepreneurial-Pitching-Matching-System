import '../../domain/entities/document_entity.dart';

class DocumentModel extends DocumentEntity {
  const DocumentModel({
    required String id,
    required String ownerId,
    required String? submissionId,
    required DocumentType type,
    required String filename,
    required String cloudinaryPublicId,
    required String url,
    required int sizeBytes,
    required String mimeType,
    required DocumentProcessingStatus status,
    required String? extractedText,
    required String? aiSummary,
    required List<String> aiTags,
    required double? aiConfidence,
    required String? processingError,
    required DateTime? processedAt,
    required DateTime createdAt,
    required DateTime updatedAt,
  }) : super(
          id: id,
          ownerId: ownerId,
          submissionId: submissionId,
          type: type,
          filename: filename,
          cloudinaryPublicId: cloudinaryPublicId,
          url: url,
          sizeBytes: sizeBytes,
          mimeType: mimeType,
          status: status,
          extractedText: extractedText,
          aiSummary: aiSummary,
          aiTags: aiTags,
          aiConfidence: aiConfidence,
          processingError: processingError,
          processedAt: processedAt,
          createdAt: createdAt,
          updatedAt: updatedAt,
        );

  factory DocumentModel.fromJson(Map<String, dynamic> json) {
    final entity = DocumentEntity.fromJson(json);
    return DocumentModel(
      id: entity.id,
      ownerId: entity.ownerId,
      submissionId: entity.submissionId,
      type: entity.type,
      filename: entity.filename,
      cloudinaryPublicId: entity.cloudinaryPublicId,
      url: entity.url,
      sizeBytes: entity.sizeBytes,
      mimeType: entity.mimeType,
      status: entity.status,
      extractedText: entity.extractedText,
      aiSummary: entity.aiSummary,
      aiTags: entity.aiTags,
      aiConfidence: entity.aiConfidence,
      processingError: entity.processingError,
      processedAt: entity.processedAt,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    );
  }

  factory DocumentModel.fromEntity(DocumentEntity entity) {
    return DocumentModel(
      id: entity.id,
      ownerId: entity.ownerId,
      submissionId: entity.submissionId,
      type: entity.type,
      filename: entity.filename,
      cloudinaryPublicId: entity.cloudinaryPublicId,
      url: entity.url,
      sizeBytes: entity.sizeBytes,
      mimeType: entity.mimeType,
      status: entity.status,
      extractedText: entity.extractedText,
      aiSummary: entity.aiSummary,
      aiTags: entity.aiTags,
      aiConfidence: entity.aiConfidence,
      processingError: entity.processingError,
      processedAt: entity.processedAt,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    );
  }
}
