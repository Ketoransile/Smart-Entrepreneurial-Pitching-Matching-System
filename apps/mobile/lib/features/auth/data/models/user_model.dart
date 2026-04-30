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
    required super.isActive,
    super.lastLoginAt,
    required super.createdAt,
    required super.updatedAt,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    final uid = (json['uid'] as String?) ??
        (json['firebaseUid'] as String?) ??
        (json['_id'] as String?) ??
        (json['id'] as String?) ??
        '';
    final displayName =
        (json['displayName'] as String?) ?? (json['fullName'] as String?);

    return UserModel(
      uid: uid,
      email: json['email'] as String?,
      displayName: displayName,
      role: _parseRole(json['role'] as String?),
      adminLevel: json['adminLevel'] as String?,
      status: _parseStatus(json['status'] as String?),
      photoURL: json['photoURL'] as String?,
      emailVerified: json['emailVerified'] as bool? ?? false,
      kycRejectionReason: json['kycRejectionReason'] as String?,
      isActive: json['isActive'] as bool? ?? true,
      lastLoginAt: _parseDate(json['lastLoginAt']),
      createdAt: _parseDate(json['createdAt']) ?? DateTime.now(),
      updatedAt: _parseDate(json['updatedAt']) ?? DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'uid': uid,
      'firebaseUid': uid,
      'email': email,
      'displayName': displayName,
      'fullName': displayName,
      'role': role.name,
      'adminLevel': adminLevel,
      'status': status.name,
      'photoURL': photoURL,
      'emailVerified': emailVerified,
      'kycRejectionReason': kycRejectionReason,
      'isActive': isActive,
      if (lastLoginAt != null) 'lastLoginAt': lastLoginAt?.toIso8601String(),
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
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
      isActive: entity.isActive,
      lastLoginAt: entity.lastLoginAt,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    );
  }
}

DateTime? _parseDate(dynamic value) {
  if (value == null) return null;
  if (value is DateTime) return value;
  if (value is String) return DateTime.tryParse(value);
  return null;
}
