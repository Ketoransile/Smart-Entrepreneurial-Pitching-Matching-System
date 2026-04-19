import 'dart:io';

import 'package:dartz/dartz.dart';

import '../../../../core/error/failures.dart';
import '../entities/document_entity.dart';

abstract class DocumentsRepository {
  Future<Either<Failure, List<DocumentEntity>>> listMyDocuments();
  Future<Either<Failure, DocumentEntity>> uploadDocument({
    required File file,
    required String type,
    String? submissionId,
  });
  Future<Either<Failure, Unit>> deleteDocument(String id);
  Future<Either<Failure, Map<String, dynamic>>> validationStatus(String id);
}

