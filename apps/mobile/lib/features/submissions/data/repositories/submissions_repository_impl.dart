import 'package:dartz/dartz.dart';

import '../../../../core/error/failures.dart';
import '../../domain/entities/submission_entity.dart';
import '../../domain/repositories/submissions_repository.dart';
import '../datasources/submissions_remote_datasource.dart';

class SubmissionsRepositoryImpl implements SubmissionsRepository {
  final SubmissionsRemoteDataSource _remote;
  SubmissionsRepositoryImpl({required SubmissionsRemoteDataSource remote})
      : _remote = remote;

  @override
  Future<Either<Failure, List<SubmissionEntity>>> listMySubmissions() async {
    try {
      final list = await _remote.listMySubmissions();
      return Right(list);
    } on Failure catch (e) {
      return Left(e);
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, SubmissionEntity>> createDraft({
    String? title,
    String? sector,
    String? stage,
  }) async {
    try {
      final s = await _remote.createDraft(title: title, sector: sector, stage: stage);
      return Right(s);
    } on Failure catch (e) {
      return Left(e);
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, SubmissionEntity>> getById(String id) async {
    try {
      final s = await _remote.getById(id);
      return Right(s);
    } on Failure catch (e) {
      return Left(e);
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, SubmissionEntity>> updateDraft(
    String id,
    Map<String, dynamic> patch,
  ) async {
    try {
      final s = await _remote.updateDraft(id, patch);
      return Right(s);
    } on Failure catch (e) {
      return Left(e);
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, Unit>> deleteDraft(String id) async {
    try {
      await _remote.deleteDraft(id);
      return const Right(unit);
    } on Failure catch (e) {
      return Left(e);
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, Unit>> submit(String id) async {
    try {
      await _remote.submit(id);
      return const Right(unit);
    } on Failure catch (e) {
      return Left(e);
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, Map<String, dynamic>>> completeness(String id) async {
    try {
      final result = await _remote.completeness(id);
      return Right(result);
    } on Failure catch (e) {
      return Left(e);
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }
}

