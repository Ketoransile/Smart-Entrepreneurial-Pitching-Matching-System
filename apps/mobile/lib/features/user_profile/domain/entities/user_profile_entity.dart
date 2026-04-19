import 'package:equatable/equatable.dart';

class UserProfileEntity extends Equatable {
  /// Raw profile payload from `GET /api/users/me/profile`.
  /// The backend schema is `additionalProperties: true`, so we keep it flexible.
  final Map<String, dynamic> data;

  const UserProfileEntity({required this.data});

  Map<String, dynamic>? get roleProfile {
    final candidateKeys = [
      'roleProfile',
      'entrepreneurProfile',
      'investorProfile',
      'profile',
    ];
    for (final key in candidateKeys) {
      final v = data[key];
      if (v is Map<String, dynamic>) return v;
    }
    return null;
  }

  bool get hasRoleProfile => roleProfile != null && roleProfile!.isNotEmpty;

  @override
  List<Object?> get props => [data];
}

