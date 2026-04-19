import 'package:equatable/equatable.dart';

import '../../domain/entities/user_profile_entity.dart';

enum UserProfileStatus { initial, loading, loaded, error }

class UserProfileState extends Equatable {
  final UserProfileStatus status;
  final UserProfileEntity? profile;
  final String? errorMessage;

  const UserProfileState({
    required this.status,
    this.profile,
    this.errorMessage,
  });

  const UserProfileState.initial()
      : status = UserProfileStatus.initial,
        profile = null,
        errorMessage = null;

  UserProfileState copyWith({
    UserProfileStatus? status,
    UserProfileEntity? profile,
    String? errorMessage,
  }) {
    return UserProfileState(
      status: status ?? this.status,
      profile: profile ?? this.profile,
      errorMessage: errorMessage,
    );
  }

  bool get isLoading => status == UserProfileStatus.loading;

  @override
  List<Object?> get props => [status, profile, errorMessage];
}

