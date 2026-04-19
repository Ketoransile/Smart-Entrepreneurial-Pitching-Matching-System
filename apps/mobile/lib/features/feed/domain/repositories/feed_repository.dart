import 'package:dartz/dartz.dart';

import '../../../../core/error/failures.dart';
import '../../../submissions/domain/entities/submission_entity.dart';

abstract class FeedRepository {
  Future<Either<Failure, List<SubmissionEntity>>> browse({
    String? sector,
    String? sort,
    int? page,
    int? limit,
  });
  Future<Either<Failure, SubmissionEntity>> getPitch(String id);
}

