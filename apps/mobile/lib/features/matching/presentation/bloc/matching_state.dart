part of 'matching_bloc.dart';

enum MatchingStatus { initial, loading, loaded, error }

class MatchingState extends Equatable {
  final MatchingStatus status;
  final List<MatchResultEntity> results;
  final String? error;

  const MatchingState({
    required this.status,
    this.results = const [],
    this.error,
  });

  const MatchingState.initial()
      : status = MatchingStatus.initial,
        results = const [],
        error = null;

  MatchingState copyWith({
    MatchingStatus? status,
    List<MatchResultEntity>? results,
    String? error,
  }) {
    return MatchingState(
      status: status ?? this.status,
      results: results ?? this.results,
      error: error,
    );
  }

  bool get isLoading => status == MatchingStatus.loading;

  @override
  List<Object?> get props => [status, results, error];
}

