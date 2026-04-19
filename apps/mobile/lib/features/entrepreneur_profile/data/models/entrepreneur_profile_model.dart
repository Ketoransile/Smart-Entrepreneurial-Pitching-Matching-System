import '../../domain/entities/entrepreneur_profile_entity.dart';

class EntrepreneurProfileModel extends EntrepreneurProfileEntity {
  const EntrepreneurProfileModel({required super.data});

  factory EntrepreneurProfileModel.fromJson(Map<String, dynamic> json) {
    return EntrepreneurProfileModel(data: json);
  }
}

