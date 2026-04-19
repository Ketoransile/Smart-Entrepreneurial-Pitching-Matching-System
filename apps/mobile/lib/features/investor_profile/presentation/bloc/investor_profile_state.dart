part of 'investor_profile_bloc.dart';

enum InvestorProfileStatus { initial, loading, loaded, error }

class InvestorProfileState extends Equatable {
  final InvestorProfileStatus status;
  final InvestorProfileEntity? profile;
  final String? error;

  const InvestorProfileState({
    required this.status,
    this.profile,
    this.error,
  });

  const InvestorProfileState.initial()
      : status = InvestorProfileStatus.initial,
        profile = null,
        error = null;

  InvestorProfileState copyWith({
    InvestorProfileStatus? status,
    InvestorProfileEntity? profile,
    String? error,
  }) {
    return InvestorProfileState(
      status: status ?? this.status,
      profile: profile ?? this.profile,
      error: error,
    );
  }

  bool get isLoading => status == InvestorProfileStatus.loading;

  @override
  List<Object?> get props => [status, profile, error];
}

