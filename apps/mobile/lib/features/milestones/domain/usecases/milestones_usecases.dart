import 'package:dartz/dartz.dart';

import '../../../../core/error/failures.dart';
import '../entities/milestone_entity.dart';
import '../repositories/milestones_repository.dart';

class ListMilestonesUseCase {
  final MilestonesRepository _repo;
  ListMilestonesUseCase(this._repo);
  Future<Either<Failure, List<MilestoneEntity>>> call({
    String? submissionId,
    String? matchResultId,
    String? status,
  }) =>
      _repo.list(submissionId: submissionId, matchResultId: matchResultId, status: status);
}

class CreateMilestoneUseCase {
  final MilestonesRepository _repo;
  CreateMilestoneUseCase(this._repo);
  Future<Either<Failure, MilestoneEntity>> call(Map<String, dynamic> payload) =>
      _repo.create(payload);
}

class UpdateMilestoneUseCase {
  final MilestonesRepository _repo;
  UpdateMilestoneUseCase(this._repo);
  Future<Either<Failure, MilestoneEntity>> call(String id, Map<String, dynamic> payload) =>
      _repo.update(id, payload);
}

class SubmitMilestoneEvidenceUseCase {
  final MilestonesRepository _repo;
  SubmitMilestoneEvidenceUseCase(this._repo);
  Future<Either<Failure, Unit>> call(String id, Map<String, dynamic> payload) =>
      _repo.submitEvidence(id, payload);
}

class VerifyMilestoneUseCase {
  final MilestonesRepository _repo;
  VerifyMilestoneUseCase(this._repo);
  Future<Either<Failure, Unit>> call(String id, Map<String, dynamic> payload) =>
      _repo.verify(id, payload);
}

