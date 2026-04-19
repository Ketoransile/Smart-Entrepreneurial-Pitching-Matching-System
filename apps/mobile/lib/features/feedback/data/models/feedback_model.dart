import '../../domain/entities/feedback_entity.dart';

class FeedbackModel extends FeedbackEntity {
  const FeedbackModel({required super.data});

  factory FeedbackModel.fromJson(Map<String, dynamic> json) {
    return FeedbackModel(data: json);
  }
}

