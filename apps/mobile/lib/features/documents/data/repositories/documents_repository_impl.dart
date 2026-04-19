import 'dart:io';

import 'package:dartz/dartz.dart';

import '../../../../core/error/failures.dart';
import '../../domain/entities/document_entity.dart';
import '../../domain/repositories/documents_repository.dart';
import '../datasources/documents_remote_datasource.dart';

class DocumentsRepositoryImpl implements DocumentsRepository {
  final DocumentsRemoteDataSource _remote;
  DocumentsRepositoryImpl({required DocumentsRemoteDataSource remote}) : _remote = remote;

  @override
  Future<Either<Failure, List<DocumentEntity>>> listMyDocuments() async {
    try {
      final list = await _remote.listMyDocuments();
      return Right(list);
    } on Failure catch (e) {
      return Left(e);
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, DocumentEntity>> uploadDocument({
    required File file,
    required String type,
    String? submissionId,
  }) async {
    try {
      final doc = await _remote.uploadDocument(
        file: file,
        type: type,
        submissionId: submissionId,
      );
      return Right(doc);
    } on Failure catch (e) {
      return Left(e);
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, Unit>> deleteDocument(String id) async {
    try {
      await _remote.deleteDocument(id);
      return const Right(unit);
    } on Failure catch (e) {
      return Left(e);
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, Map<String, dynamic>>> validationStatus(String id) async {
    try {
      final result = await _remote.validationStatus(id);
      return Right(result);
    } on Failure catch (e) {
      return Left(e);
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }
}

