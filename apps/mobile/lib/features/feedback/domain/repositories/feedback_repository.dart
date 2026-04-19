import 'package:dartz/dartz.dart';

import '../../../../core/error/failures.dart';
import '../entities/feedback_entity.dart';

abstract class FeedbackRepository {
  Future<Either<Failure, FeedbackEntity>> submit(Map<String, dynamic> payload);
  Future<Either<Failure, List<FeedbackEntity>>> listReceived();
  Future<Either<Failure, List<FeedbackEntity>>> listGiven();
  Future<Either<Failure, Map<String, dynamic>>> summary();
}

