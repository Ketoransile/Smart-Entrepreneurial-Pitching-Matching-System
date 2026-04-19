import '../../domain/entities/document_entity.dart';

class DocumentModel extends DocumentEntity {
  const DocumentModel({required super.data});

  factory DocumentModel.fromJson(Map<String, dynamic> json) {
    return DocumentModel(data: json);
  }
}

