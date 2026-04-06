import '../../domain/entities/user_entity.dart';

class UserModel extends UserEntity {
  const UserModel({
    required super.uid,
    super.email,
    super.displayName,
    required super.role,
    super.adminLevel,
    required super.status,
    super.photoURL,
    required super.emailVerified,
    super.kycRejectionReason,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      uid: json['uid'] as String,
      email: json['email'] as String?,
      displayName: json['displayName'] as String?,
      role: _parseRole(json['role'] as String?),
      adminLevel: json['adminLevel'] as String?,
      status: _parseStatus(json['status'] as String?),
      photoURL: json['photoURL'] as String?,
      emailVerified: json['emailVerified'] as bool? ?? false,
      kycRejectionReason: json['kycRejectionReason'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'uid': uid,
      'email': email,
      'displayName': displayName,
      'role': role.name,
      'adminLevel': adminLevel,
      'status': status.name,
      'photoURL': photoURL,
      'emailVerified': emailVerified,
      'kycRejectionReason': kycRejectionReason,
    };
  }

  static UserRole _parseRole(String? role) {
    switch (role) {
      case 'entrepreneur':
        return UserRole.entrepreneur;
      case 'investor':
        return UserRole.investor;
      case 'admin':
        return UserRole.admin;
      default:
        return UserRole.entrepreneur;
    }
  }

  static UserStatus _parseStatus(String? status) {
    switch (status) {
      case 'unverified':
        return UserStatus.unverified;
      case 'pending':
        return UserStatus.pending;
      case 'verified':
        return UserStatus.verified;
      case 'suspended':
        return UserStatus.suspended;
      default:
        return UserStatus.unverified;
    }
  }

  factory UserModel.fromEntity(UserEntity entity) {
    return UserModel(
      uid: entity.uid,
      email: entity.email,
      displayName: entity.displayName,
      role: entity.role,
      adminLevel: entity.adminLevel,
      status: entity.status,
      photoURL: entity.photoURL,
      emailVerified: entity.emailVerified,
      kycRejectionReason: entity.kycRejectionReason,
    );
  }
}
