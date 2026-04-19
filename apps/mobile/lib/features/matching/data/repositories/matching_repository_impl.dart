import 'package:dartz/dartz.dart';

import '../../../../core/error/failures.dart';
import '../../domain/entities/match_result_entity.dart';
import '../../domain/repositories/matching_repository.dart';
import '../datasources/matching_remote_datasource.dart';

class MatchingRepositoryImpl implements MatchingRepository {
  final MatchingRemoteDataSource _remote;
  MatchingRepositoryImpl({required MatchingRemoteDataSource remote}) : _remote = remote;

  @override
  Future<Either<Failure, Unit>> runMatching(
    String submissionId, {
    int? limit,
    double? minScore,
  }) async {
    try {
      await _remote.runMatching(submissionId, limit: limit, minScore: minScore);
      return const Right(unit);
    } on Failure catch (e) {
      return Left(e);
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, List<MatchResultEntity>>> getResults(String submissionId) async {
    try {
      final results = await _remote.getResults(submissionId);
      return Right(results);
    } on Failure catch (e) {
      return Left(e);
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }
}

