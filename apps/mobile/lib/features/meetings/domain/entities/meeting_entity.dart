import 'package:equatable/equatable.dart';

class MeetingEntity extends Equatable {
  final Map<String, dynamic> data;
  const MeetingEntity({required this.data});

  String get id => (data['_id'] as String?) ?? (data['id'] as String?) ?? '';
  String get title => (data['title'] as String?) ?? '';
  String get status => (data['status'] as String?) ?? '';
  String get meetingUrl => (data['meetingUrl'] as String?) ?? '';

  DateTime? get scheduledAt {
    final v = data['scheduledAt'];
    if (v is String) return DateTime.tryParse(v);
    return null;
  }

  @override
  List<Object?> get props => [data];
}

