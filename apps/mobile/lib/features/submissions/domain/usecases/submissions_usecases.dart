import 'package:dartz/dartz.dart';

import '../../../../core/error/failures.dart';
import '../entities/submission_entity.dart';
import '../repositories/submissions_repository.dart';

class ListMySubmissionsUseCase {
  final SubmissionsRepository _repo;
  ListMySubmissionsUseCase(this._repo);
  Future<Either<Failure, List<SubmissionEntity>>> call() => _repo.listMySubmissions();
}

class CreateDraftUseCase {
  final SubmissionsRepository _repo;
  CreateDraftUseCase(this._repo);
  Future<Either<Failure, SubmissionEntity>> call({
    String? title,
    String? sector,
    String? stage,
  }) =>
      _repo.createDraft(title: title, sector: sector, stage: stage);
}

class UpdateDraftUseCase {
  final SubmissionsRepository _repo;
  UpdateDraftUseCase(this._repo);
  Future<Either<Failure, SubmissionEntity>> call(
    String id,
    Map<String, dynamic> patch,
  ) =>
      _repo.updateDraft(id, patch);
}

class DeleteDraftUseCase {
  final SubmissionsRepository _repo;
  DeleteDraftUseCase(this._repo);
  Future<Either<Failure, Unit>> call(String id) => _repo.deleteDraft(id);
}

class SubmitPitchUseCase {
  final SubmissionsRepository _repo;
  SubmitPitchUseCase(this._repo);
  Future<Either<Failure, Unit>> call(String id) => _repo.submit(id);
}

class CompletenessUseCase {
  final SubmissionsRepository _repo;
  CompletenessUseCase(this._repo);
  Future<Either<Failure, Map<String, dynamic>>> call(String id) =>
      _repo.completeness(id);
}

