part of 'submissions_bloc.dart';

enum SubmissionsStatus { initial, loading, loaded, completenessLoaded, error }

class SubmissionsState extends Equatable {
  final SubmissionsStatus status;
  final List<SubmissionEntity> items;
  final Map<String, dynamic>? completeness;
  final String? error;

  const SubmissionsState({
    required this.status,
    this.items = const [],
    this.completeness,
    this.error,
  });

  const SubmissionsState.initial()
      : status = SubmissionsStatus.initial,
        items = const [],
        completeness = null,
        error = null;

  SubmissionsState copyWith({
    SubmissionsStatus? status,
    List<SubmissionEntity>? items,
    Map<String, dynamic>? completeness,
    String? error,
  }) {
    return SubmissionsState(
      status: status ?? this.status,
      items: items ?? this.items,
      completeness: completeness ?? this.completeness,
      error: error,
    );
  }

  bool get isLoading => status == SubmissionsStatus.loading;

  @override
  List<Object?> get props => [status, items, completeness, error];
}

