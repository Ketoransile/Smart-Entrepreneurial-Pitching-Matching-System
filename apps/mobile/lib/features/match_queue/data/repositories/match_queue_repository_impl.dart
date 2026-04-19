import 'package:dartz/dartz.dart';

import '../../../../core/error/failures.dart';
import '../../../matching/domain/entities/match_result_entity.dart';
import '../../domain/repositories/match_queue_repository.dart';
import '../datasources/match_queue_remote_datasource.dart';

class MatchQueueRepositoryImpl implements MatchQueueRepository {
  final MatchQueueRemoteDataSource _remote;
  MatchQueueRepositoryImpl({required MatchQueueRemoteDataSource remote}) : _remote = remote;

  @override
  Future<Either<Failure, List<MatchResultEntity>>> list({String? status}) async {
    try {
      final items = await _remote.list(status: status);
      return Right(items);
    } on Failure catch (e) {
      return Left(e);
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, Unit>> updateStatus(String matchId, String status) async {
    try {
      await _remote.updateStatus(matchId, status);
      return const Right(unit);
    } on Failure catch (e) {
      return Left(e);
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }
}

