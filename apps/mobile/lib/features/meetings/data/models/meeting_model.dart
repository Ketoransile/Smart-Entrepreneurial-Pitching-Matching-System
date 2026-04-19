import '../../domain/entities/meeting_entity.dart';

class MeetingModel extends MeetingEntity {
  const MeetingModel({required super.data});

  factory MeetingModel.fromJson(Map<String, dynamic> json) {
    return MeetingModel(data: json);
  }
}

