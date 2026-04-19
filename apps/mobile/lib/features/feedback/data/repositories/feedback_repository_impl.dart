import 'package:dartz/dartz.dart';

import '../../../../core/error/failures.dart';
import '../../domain/entities/feedback_entity.dart';
import '../../domain/repositories/feedback_repository.dart';
import '../datasources/feedback_remote_datasource.dart';

class FeedbackRepositoryImpl implements FeedbackRepository {
  final FeedbackRemoteDataSource _remote;
  FeedbackRepositoryImpl({required FeedbackRemoteDataSource remote}) : _remote = remote;

  @override
  Future<Either<Failure, FeedbackEntity>> submit(Map<String, dynamic> payload) async {
    try {
      final fb = await _remote.submit(payload);
      return Right(fb);
    } on Failure catch (e) {
      return Left(e);
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, List<FeedbackEntity>>> listReceived() async {
    try {
      final list = await _remote.listReceived();
      return Right(list);
    } on Failure catch (e) {
      return Left(e);
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, List<FeedbackEntity>>> listGiven() async {
    try {
      final list = await _remote.listGiven();
      return Right(list);
    } on Failure catch (e) {
      return Left(e);
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, Map<String, dynamic>>> summary() async {
    try {
      final s = await _remote.summary();
      return Right(s);
    } on Failure catch (e) {
      return Left(e);
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }
}

