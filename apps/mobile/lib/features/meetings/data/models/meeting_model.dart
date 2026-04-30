import '../../domain/entities/meeting_entity.dart';

class MeetingModel extends MeetingEntity {
  const MeetingModel({
    required String id,
    required String organizerId,
    required List<String> participants,
    required String? submissionId,
    required String title,
    required DateTime scheduledAt,
    required int durationMinutes,
    required String? meetingUrl,
    required String? livekitRoomName,
    required MeetingStatus status,
    required String? notes,
    required DateTime createdAt,
    required DateTime updatedAt,
  }) : super(
          id: id,
          organizerId: organizerId,
          participants: participants,
          submissionId: submissionId,
          title: title,
          scheduledAt: scheduledAt,
          durationMinutes: durationMinutes,
          meetingUrl: meetingUrl,
          livekitRoomName: livekitRoomName,
          status: status,
          notes: notes,
          createdAt: createdAt,
          updatedAt: updatedAt,
        );

  factory MeetingModel.fromJson(Map<String, dynamic> json) {
    final entity = MeetingEntity.fromJson(json);
    return MeetingModel(
      id: entity.id,
      organizerId: entity.organizerId,
      participants: entity.participants,
      submissionId: entity.submissionId,
      title: entity.title,
      scheduledAt: entity.scheduledAt,
      durationMinutes: entity.durationMinutes,
      meetingUrl: entity.meetingUrl,
      livekitRoomName: entity.livekitRoomName,
      status: entity.status,
      notes: entity.notes,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    );
  }

  factory MeetingModel.fromEntity(MeetingEntity entity) {
    return MeetingModel(
      id: entity.id,
      organizerId: entity.organizerId,
      participants: entity.participants,
      submissionId: entity.submissionId,
      title: entity.title,
      scheduledAt: entity.scheduledAt,
      durationMinutes: entity.durationMinutes,
      meetingUrl: entity.meetingUrl,
      livekitRoomName: entity.livekitRoomName,
      status: entity.status,
      notes: entity.notes,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    );
  }
}
