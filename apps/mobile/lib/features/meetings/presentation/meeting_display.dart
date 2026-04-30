import '../domain/entities/meeting_entity.dart';

String meetingStatusLabel(MeetingStatus status) {
  return switch (status) {
    MeetingStatus.scheduled => 'Scheduled',
    MeetingStatus.ongoing => 'Ongoing',
    MeetingStatus.completed => 'Completed',
    MeetingStatus.cancelled => 'Cancelled',
  };
}
