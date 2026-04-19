import 'package:dartz/dartz.dart';

import '../../../../core/error/failures.dart';
import '../entities/meeting_entity.dart';

abstract class MeetingsRepository {
  Future<Either<Failure, List<MeetingEntity>>> list({String? status});
  Future<Either<Failure, MeetingEntity>> schedule(Map<String, dynamic> payload);
  Future<Either<Failure, MeetingEntity>> updateStatus(
    String meetingId,
    Map<String, dynamic> payload,
  );
}

