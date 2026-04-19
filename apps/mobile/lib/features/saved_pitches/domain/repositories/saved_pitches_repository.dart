import 'package:dartz/dartz.dart';

import '../../../../core/error/failures.dart';
import '../../../submissions/domain/entities/submission_entity.dart';

abstract class SavedPitchesRepository {
  Future<Either<Failure, List<SubmissionEntity>>> listSaved();
  Future<Either<Failure, Unit>> toggleSaved(String pitchId);
}

