import 'package:dartz/dartz.dart';

import '../../../../core/error/failures.dart';
import '../../../submissions/domain/entities/submission_entity.dart';
import '../../domain/repositories/saved_pitches_repository.dart';
import '../datasources/saved_pitches_remote_datasource.dart';

class SavedPitchesRepositoryImpl implements SavedPitchesRepository {
  final SavedPitchesRemoteDataSource _remote;
  SavedPitchesRepositoryImpl({required SavedPitchesRemoteDataSource remote})
      : _remote = remote;

  @override
  Future<Either<Failure, List<SubmissionEntity>>> listSaved() async {
    try {
      final list = await _remote.listSaved();
      return Right(list);
    } on Failure catch (e) {
      return Left(e);
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, Unit>> toggleSaved(String pitchId) async {
    try {
      await _remote.toggleSaved(pitchId);
      return const Right(unit);
    } on Failure catch (e) {
      return Left(e);
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }
}

