import 'package:dartz/dartz.dart';

import '../../../../core/error/failures.dart';
import '../entities/match_result_entity.dart';
import '../repositories/matching_repository.dart';

class RunMatchingUseCase {
  final MatchingRepository _repo;
  RunMatchingUseCase(this._repo);
  Future<Either<Failure, Unit>> call(
    String submissionId, {
    int? limit,
    double? minScore,
  }) =>
      _repo.runMatching(submissionId, limit: limit, minScore: minScore);
}

class GetMatchResultsUseCase {
  final MatchingRepository _repo;
  GetMatchResultsUseCase(this._repo);
  Future<Either<Failure, List<MatchResultEntity>>> call(String submissionId) =>
      _repo.getResults(submissionId);
}

