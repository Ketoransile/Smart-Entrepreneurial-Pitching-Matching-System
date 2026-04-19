import '../../domain/entities/milestone_entity.dart';

class MilestoneModel extends MilestoneEntity {
  const MilestoneModel({required super.data});

  factory MilestoneModel.fromJson(Map<String, dynamic> json) {
    return MilestoneModel(data: json);
  }
}

