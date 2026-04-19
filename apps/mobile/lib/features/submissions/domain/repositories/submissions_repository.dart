import 'package:dartz/dartz.dart';

import '../../../../core/error/failures.dart';
import '../entities/submission_entity.dart';

abstract class SubmissionsRepository {
  Future<Either<Failure, List<SubmissionEntity>>> listMySubmissions();
  Future<Either<Failure, SubmissionEntity>> createDraft({
    String? title,
    String? sector,
    String? stage,
  });
  Future<Either<Failure, SubmissionEntity>> getById(String id);
  Future<Either<Failure, SubmissionEntity>> updateDraft(
    String id,
    Map<String, dynamic> patch,
  );
  Future<Either<Failure, Unit>> deleteDraft(String id);
  Future<Either<Failure, Unit>> submit(String id);
  Future<Either<Failure, Map<String, dynamic>>> completeness(String id);
}

