import 'package:dartz/dartz.dart';

import '../../../../core/error/failures.dart';
import '../entities/milestone_entity.dart';

abstract class MilestonesRepository {
  Future<Either<Failure, List<MilestoneEntity>>> list({
    String? submissionId,
    String? matchResultId,
    String? status,
  });
  Future<Either<Failure, MilestoneEntity>> create(Map<String, dynamic> payload);
  Future<Either<Failure, MilestoneEntity>> update(String id, Map<String, dynamic> payload);
  Future<Either<Failure, Unit>> submitEvidence(String id, Map<String, dynamic> payload);
  Future<Either<Failure, Unit>> verify(String id, Map<String, dynamic> payload);
}

