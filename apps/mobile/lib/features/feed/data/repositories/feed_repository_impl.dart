import 'package:dartz/dartz.dart';

import '../../../../core/error/failures.dart';
import '../../../submissions/domain/entities/submission_entity.dart';
import '../../domain/repositories/feed_repository.dart';
import '../datasources/feed_remote_datasource.dart';

class FeedRepositoryImpl implements FeedRepository {
  final FeedRemoteDataSource _remote;
  FeedRepositoryImpl({required FeedRemoteDataSource remote}) : _remote = remote;

  @override
  Future<Either<Failure, List<SubmissionEntity>>> browse({
    String? sector,
    String? sort,
    int? page,
    int? limit,
  }) async {
    try {
      final list = await _remote.browse(
        sector: sector,
        sort: sort,
        page: page,
        limit: limit,
      );
      return Right(list);
    } on Failure catch (e) {
      return Left(e);
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, SubmissionEntity>> getPitch(String id) async {
    try {
      final pitch = await _remote.getPitch(id);
      return Right(pitch);
    } on Failure catch (e) {
      return Left(e);
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }
}

