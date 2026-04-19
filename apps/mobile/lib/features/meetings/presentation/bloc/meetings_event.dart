part of 'meetings_bloc.dart';

abstract class MeetingsEvent extends Equatable {
  const MeetingsEvent();
  @override
  List<Object?> get props => [];
}

class MeetingsRequested extends MeetingsEvent {
  final String? status;
  const MeetingsRequested({this.status});
  @override
  List<Object?> get props => [status];
}

class MeetingScheduled extends MeetingsEvent {
  final Map<String, dynamic> payload;
  const MeetingScheduled(this.payload);
  @override
  List<Object?> get props => [payload];
}

class MeetingStatusUpdated extends MeetingsEvent {
  final String meetingId;
  final Map<String, dynamic> payload;
  const MeetingStatusUpdated({required this.meetingId, required this.payload});
  @override
  List<Object?> get props => [meetingId, payload];
}

