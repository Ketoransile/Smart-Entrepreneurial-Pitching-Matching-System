import 'package:dartz/dartz.dart';

import '../../../../core/error/failures.dart';
import '../../../submissions/domain/entities/submission_entity.dart';
import '../repositories/feed_repository.dart';

class BrowseFeedUseCase {
  final FeedRepository _repo;
  BrowseFeedUseCase(this._repo);
  Future<Either<Failure, List<SubmissionEntity>>> call({
    String? sector,
    String? sort,
    int? page,
    int? limit,
  }) =>
      _repo.browse(sector: sector, sort: sort, page: page, limit: limit);
}

class GetPitchUseCase {
  final FeedRepository _repo;
  GetPitchUseCase(this._repo);
  Future<Either<Failure, SubmissionEntity>> call(String id) => _repo.getPitch(id);
}

