import 'package:dartz/dartz.dart';

import '../../../../core/error/failures.dart';
import '../entities/feedback_entity.dart';
import '../repositories/feedback_repository.dart';

class SubmitFeedbackUseCase {
  final FeedbackRepository _repo;
  SubmitFeedbackUseCase(this._repo);
  Future<Either<Failure, FeedbackEntity>> call(Map<String, dynamic> payload) =>
      _repo.submit(payload);
}

class ListReceivedFeedbackUseCase {
  final FeedbackRepository _repo;
  ListReceivedFeedbackUseCase(this._repo);
  Future<Either<Failure, List<FeedbackEntity>>> call() => _repo.listReceived();
}

class ListGivenFeedbackUseCase {
  final FeedbackRepository _repo;
  ListGivenFeedbackUseCase(this._repo);
  Future<Either<Failure, List<FeedbackEntity>>> call() => _repo.listGiven();
}

class FeedbackSummaryUseCase {
  final FeedbackRepository _repo;
  FeedbackSummaryUseCase(this._repo);
  Future<Either<Failure, Map<String, dynamic>>> call() => _repo.summary();
}

