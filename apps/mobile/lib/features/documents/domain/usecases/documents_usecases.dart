import 'dart:io';

import 'package:dartz/dartz.dart';

import '../../../../core/error/failures.dart';
import '../entities/document_entity.dart';
import '../repositories/documents_repository.dart';

class ListMyDocumentsUseCase {
  final DocumentsRepository _repo;
  ListMyDocumentsUseCase(this._repo);
  Future<Either<Failure, List<DocumentEntity>>> call() => _repo.listMyDocuments();
}

class UploadDocumentUseCase {
  final DocumentsRepository _repo;
  UploadDocumentUseCase(this._repo);
  Future<Either<Failure, DocumentEntity>> call({
    required File file,
    required String type,
    String? submissionId,
  }) =>
      _repo.uploadDocument(file: file, type: type, submissionId: submissionId);
}

class DeleteDocumentUseCase {
  final DocumentsRepository _repo;
  DeleteDocumentUseCase(this._repo);
  Future<Either<Failure, Unit>> call(String id) => _repo.deleteDocument(id);
}

class DocumentValidationStatusUseCase {
  final DocumentsRepository _repo;
  DocumentValidationStatusUseCase(this._repo);
  Future<Either<Failure, Map<String, dynamic>>> call(String id) =>
      _repo.validationStatus(id);
}

