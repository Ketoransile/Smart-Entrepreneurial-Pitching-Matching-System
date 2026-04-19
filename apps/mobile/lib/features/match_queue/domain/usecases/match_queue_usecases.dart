import 'package:dartz/dartz.dart';

import '../../../../core/error/failures.dart';
import '../../../matching/domain/entities/match_result_entity.dart';
import '../repositories/match_queue_repository.dart';

class ListMatchQueueUseCase {
  final MatchQueueRepository _repo;
  ListMatchQueueUseCase(this._repo);
  Future<Either<Failure, List<MatchResultEntity>>> call({String? status}) =>
      _repo.list(status: status);
}

class UpdateMatchStatusUseCase {
  final MatchQueueRepository _repo;
  UpdateMatchStatusUseCase(this._repo);
  Future<Either<Failure, Unit>> call(String matchId, String status) =>
      _repo.updateStatus(matchId, status);
}

