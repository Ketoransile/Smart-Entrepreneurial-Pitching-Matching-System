import 'package:equatable/equatable.dart';

enum MeetingStatus { scheduled, ongoing, completed, cancelled }

class MeetingEntity extends Equatable {
  final String id;
  final String organizerId;
  final List<String> participants;
  final String? submissionId;
  final String title;
  final DateTime scheduledAt;
  final int durationMinutes;
  final String? meetingUrl;
  final String? livekitRoomName;
  final MeetingStatus status;
  final String? notes;
  final DateTime createdAt;
  final DateTime updatedAt;

  const MeetingEntity({
    required this.id,
    required this.organizerId,
    required this.participants,
    this.submissionId,
    required this.title,
    required this.scheduledAt,
    required this.durationMinutes,
    this.meetingUrl,
    this.livekitRoomName,
    required this.status,
    this.notes,
    required this.createdAt,
    required this.updatedAt,
  });

  factory MeetingEntity.fromJson(Map<String, dynamic> json) {
    return MeetingEntity(
      id: (json['_id'] as String?) ?? (json['id'] as String?) ?? '',
      organizerId: (json['organizerId'] as String?) ?? '',
      participants:
          ((json['participants'] as List?) ?? []).whereType<String>().toList(),
      submissionId: json['submissionId'] as String?,
      title: (json['title'] as String?) ?? '',
      scheduledAt: _parseDate(json['scheduledAt']) ?? DateTime.now(),
      durationMinutes: ((json['durationMinutes'] as num?) ?? 30).toInt(),
      meetingUrl: json['meetingUrl'] as String?,
      livekitRoomName: json['livekitRoomName'] as String?,
      status: _parseStatus(json['status'] as String?),
      notes: json['notes'] as String?,
      createdAt: _parseDate(json['createdAt']) ?? DateTime.now(),
      updatedAt: _parseDate(json['updatedAt']) ?? DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() => {
        '_id': id,
        'organizerId': organizerId,
        'participants': participants,
        if (submissionId != null) 'submissionId': submissionId,
        'title': title,
        'scheduledAt': scheduledAt.toIso8601String(),
        'durationMinutes': durationMinutes,
        if (meetingUrl != null) 'meetingUrl': meetingUrl,
        if (livekitRoomName != null) 'livekitRoomName': livekitRoomName,
        'status': _statusToString(status),
        if (notes != null) 'notes': notes,
        'createdAt': createdAt.toIso8601String(),
        'updatedAt': updatedAt.toIso8601String(),
      };

  @override
  List<Object?> get props => [
        id,
        organizerId,
        participants,
        submissionId,
        title,
        scheduledAt,
        durationMinutes,
        meetingUrl,
        livekitRoomName,
        status,
        notes,
        createdAt,
        updatedAt,
      ];
}

MeetingStatus _parseStatus(String? status) {
  switch (status) {
    case 'scheduled':
      return MeetingStatus.scheduled;
    case 'ongoing':
      return MeetingStatus.ongoing;
    case 'completed':
      return MeetingStatus.completed;
    case 'cancelled':
      return MeetingStatus.cancelled;
    default:
      return MeetingStatus.scheduled;
  }
}

String _statusToString(MeetingStatus status) {
  switch (status) {
    case MeetingStatus.scheduled:
      return 'scheduled';
    case MeetingStatus.ongoing:
      return 'ongoing';
    case MeetingStatus.completed:
      return 'completed';
    case MeetingStatus.cancelled:
      return 'cancelled';
  }
}

DateTime? _parseDate(dynamic value) {
  if (value == null) return null;
  if (value is DateTime) return value;
  if (value is String) return DateTime.tryParse(value);
  return null;
}
