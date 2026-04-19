import 'package:dartz/dartz.dart';

import '../../../../core/error/failures.dart';
import '../../../matching/domain/entities/match_result_entity.dart';

abstract class MatchQueueRepository {
  Future<Either<Failure, List<MatchResultEntity>>> list({String? status});
  Future<Either<Failure, Unit>> updateStatus(String matchId, String status);
}

