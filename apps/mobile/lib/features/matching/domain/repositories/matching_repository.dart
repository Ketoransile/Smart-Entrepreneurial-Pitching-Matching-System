import 'package:dartz/dartz.dart';

import '../../../../core/error/failures.dart';
import '../entities/match_result_entity.dart';

abstract class MatchingRepository {
  Future<Either<Failure, Unit>> runMatching(
    String submissionId, {
    int? limit,
    double? minScore,
  });
  Future<Either<Failure, List<MatchResultEntity>>> getResults(String submissionId);
}

