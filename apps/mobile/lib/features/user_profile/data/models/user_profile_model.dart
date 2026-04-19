import '../../domain/entities/user_profile_entity.dart';

class UserProfileModel extends UserProfileEntity {
  const UserProfileModel({required super.data});

  factory UserProfileModel.fromJson(Map<String, dynamic> json) {
    return UserProfileModel(data: json);
  }
}

