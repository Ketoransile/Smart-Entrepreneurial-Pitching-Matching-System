import 'package:equatable/equatable.dart';

enum UserRole { entrepreneur, investor, admin }

enum UserStatus { unverified, pending, verified, suspended }

class UserEntity extends Equatable {
  final String uid;
  final String? email;
  final String? displayName;
  final UserRole role;
  final String? adminLevel;
  final UserStatus status;
  final String? photoURL;
  final bool emailVerified;
  final String? kycRejectionReason;

  const UserEntity({
    required this.uid,
    this.email,
    this.displayName,
    required this.role,
    this.adminLevel,
    required this.status,
    this.photoURL,
    required this.emailVerified,
    this.kycRejectionReason,
  });

  bool get isEntrepreneur => role == UserRole.entrepreneur;
  bool get isInvestor => role == UserRole.investor;
  bool get isAdmin => role == UserRole.admin;
  bool get isSuperAdmin => adminLevel == 'super_admin';
  bool get isVerified => status == UserStatus.verified;
  bool get isPending => status == UserStatus.pending;
  bool get isSuspended => status == UserStatus.suspended;

  UserEntity copyWith({
    String? uid,
    String? email,
    String? displayName,
    UserRole? role,
    String? adminLevel,
    UserStatus? status,
    String? photoURL,
    bool? emailVerified,
    String? kycRejectionReason,
  }) {
    return UserEntity(
      uid: uid ?? this.uid,
      email: email ?? this.email,
      displayName: displayName ?? this.displayName,
      role: role ?? this.role,
      adminLevel: adminLevel ?? this.adminLevel,
      status: status ?? this.status,
      photoURL: photoURL ?? this.photoURL,
      emailVerified: emailVerified ?? this.emailVerified,
      kycRejectionReason: kycRejectionReason ?? this.kycRejectionReason,
    );
  }

  @override
  List<Object?> get props => [
        uid,
        email,
        displayName,
        role,
        adminLevel,
        status,
        photoURL,
        emailVerified,
        kycRejectionReason,
      ];
}
