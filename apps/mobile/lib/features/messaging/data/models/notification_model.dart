import '../../domain/entities/notification_entity.dart';

class NotificationModel extends NotificationEntity {
  const NotificationModel({required super.data});

  factory NotificationModel.fromJson(Map<String, dynamic> json) {
    return NotificationModel(data: json);
  }
}

