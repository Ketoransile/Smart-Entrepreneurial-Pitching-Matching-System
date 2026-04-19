import 'package:dartz/dartz.dart';

import '../../../../core/error/failures.dart';
import '../../domain/entities/meeting_entity.dart';
import '../../domain/repositories/meetings_repository.dart';
import '../datasources/meetings_remote_datasource.dart';

class MeetingsRepositoryImpl implements MeetingsRepository {
  final MeetingsRemoteDataSource _remote;
  MeetingsRepositoryImpl({required MeetingsRemoteDataSource remote}) : _remote = remote;

  @override
  Future<Either<Failure, List<MeetingEntity>>> list({String? status}) async {
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
  Future<Either<Failure, MeetingEntity>> schedule(Map<String, dynamic> payload) async {
    try {
      final m = await _remote.schedule(payload);
      return Right(m);
    } on Failure catch (e) {
      return Left(e);
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, MeetingEntity>> updateStatus(
    String meetingId,
    Map<String, dynamic> payload,
  ) async {
    try {
      final m = await _remote.updateStatus(meetingId, payload);
      return Right(m);
    } on Failure catch (e) {
      return Left(e);
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }
}

