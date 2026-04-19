import 'package:dartz/dartz.dart';

import '../../../../core/error/failures.dart';
import '../entities/meeting_entity.dart';
import '../repositories/meetings_repository.dart';

class ListMeetingsUseCase {
  final MeetingsRepository _repo;
  ListMeetingsUseCase(this._repo);
  Future<Either<Failure, List<MeetingEntity>>> call({String? status}) =>
      _repo.list(status: status);
}

class ScheduleMeetingUseCase {
  final MeetingsRepository _repo;
  ScheduleMeetingUseCase(this._repo);
  Future<Either<Failure, MeetingEntity>> call(Map<String, dynamic> payload) =>
      _repo.schedule(payload);
}

class UpdateMeetingStatusUseCase {
  final MeetingsRepository _repo;
  UpdateMeetingStatusUseCase(this._repo);
  Future<Either<Failure, MeetingEntity>> call(
    String meetingId,
    Map<String, dynamic> payload,
  ) =>
      _repo.updateStatus(meetingId, payload);
}

