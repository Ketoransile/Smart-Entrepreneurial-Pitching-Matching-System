import 'package:dartz/dartz.dart';

import '../../../../core/error/failures.dart';
import '../../domain/entities/milestone_entity.dart';
import '../../domain/repositories/milestones_repository.dart';
import '../datasources/milestones_remote_datasource.dart';

class MilestonesRepositoryImpl implements MilestonesRepository {
  final MilestonesRemoteDataSource _remote;
  MilestonesRepositoryImpl({required MilestonesRemoteDataSource remote}) : _remote = remote;

  @override
  Future<Either<Failure, List<MilestoneEntity>>> list({
    String? submissionId,
    String? matchResultId,
    String? status,
  }) async {
    try {
      final items = await _remote.list(
        submissionId: submissionId,
        matchResultId: matchResultId,
        status: status,
      );
      return Right(items);
    } on Failure catch (e) {
      return Left(e);
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, MilestoneEntity>> create(Map<String, dynamic> payload) async {
    try {
      final m = await _remote.create(payload);
      return Right(m);
    } on Failure catch (e) {
      return Left(e);
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, MilestoneEntity>> update(String id, Map<String, dynamic> payload) async {
    try {
      final m = await _remote.update(id, payload);
      return Right(m);
    } on Failure catch (e) {
      return Left(e);
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, Unit>> submitEvidence(String id, Map<String, dynamic> payload) async {
    try {
      await _remote.submitEvidence(id, payload);
      return const Right(unit);
    } on Failure catch (e) {
      return Left(e);
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, Unit>> verify(String id, Map<String, dynamic> payload) async {
    try {
      await _remote.verify(id, payload);
      return const Right(unit);
    } on Failure catch (e) {
      return Left(e);
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }
}

