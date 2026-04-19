import '../../domain/entities/submission_entity.dart';

class SubmissionModel extends SubmissionEntity {
  const SubmissionModel({required super.data});

  factory SubmissionModel.fromJson(Map<String, dynamic> json) {
    return SubmissionModel(data: json);
  }
}

