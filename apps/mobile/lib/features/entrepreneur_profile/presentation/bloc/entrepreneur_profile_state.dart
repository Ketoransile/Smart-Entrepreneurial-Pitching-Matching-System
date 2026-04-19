part of 'entrepreneur_profile_bloc.dart';

enum EntrepreneurProfileStatus { initial, loading, missing, exists, loaded, error }

class EntrepreneurProfileState extends Equatable {
  final EntrepreneurProfileStatus status;
  final EntrepreneurProfileEntity? profile;
  final String? error;

  const EntrepreneurProfileState({
    required this.status,
    this.profile,
    this.error,
  });

  const EntrepreneurProfileState.initial()
      : status = EntrepreneurProfileStatus.initial,
        profile = null,
        error = null;

  EntrepreneurProfileState copyWith({
    EntrepreneurProfileStatus? status,
    EntrepreneurProfileEntity? profile,
    String? error,
  }) {
    return EntrepreneurProfileState(
      status: status ?? this.status,
      profile: profile ?? this.profile,
      error: error,
    );
  }

  bool get isLoading => status == EntrepreneurProfileStatus.loading;

  @override
  List<Object?> get props => [status, profile, error];
}

