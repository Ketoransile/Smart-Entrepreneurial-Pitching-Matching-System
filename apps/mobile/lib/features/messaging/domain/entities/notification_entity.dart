import 'package:equatable/equatable.dart';

class NotificationEntity extends Equatable {
  final Map<String, dynamic> data;
  const NotificationEntity({required this.data});

  String get id => (data['_id'] as String?) ?? (data['id'] as String?) ?? '';
  String get title => (data['title'] as String?) ?? (data['type'] as String?) ?? 'Notification';
  String get body => (data['body'] as String?) ?? (data['message'] as String?) ?? '';
  bool get read =>
      (data['isRead'] as bool?) ?? (data['read'] as bool?) ?? false;

  @override
  List<Object?> get props => [data];
}

