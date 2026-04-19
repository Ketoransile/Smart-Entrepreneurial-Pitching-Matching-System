import 'package:dartz/dartz.dart';

import '../../../../core/error/failures.dart';
import '../../../submissions/domain/entities/submission_entity.dart';
import '../repositories/saved_pitches_repository.dart';

class ListSavedPitchesUseCase {
  final SavedPitchesRepository _repo;
  ListSavedPitchesUseCase(this._repo);
  Future<Either<Failure, List<SubmissionEntity>>> call() => _repo.listSaved();
}

class ToggleSavedPitchUseCase {
  final SavedPitchesRepository _repo;
  ToggleSavedPitchUseCase(this._repo);
  Future<Either<Failure, Unit>> call(String pitchId) => _repo.toggleSaved(pitchId);
}

