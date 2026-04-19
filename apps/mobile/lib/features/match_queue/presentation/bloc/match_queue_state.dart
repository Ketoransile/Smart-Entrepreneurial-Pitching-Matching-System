part of 'match_queue_bloc.dart';

enum MatchQueueStatus { initial, loading, loaded, error }

class MatchQueueState extends Equatable {
  final MatchQueueStatus status;
  final List<MatchResultEntity> items;
  final String? statusFilter;
  final String? error;

  const MatchQueueState({
    required this.status,
    this.items = const [],
    this.statusFilter,
    this.error,
  });

  const MatchQueueState.initial()
      : status = MatchQueueStatus.initial,
        items = const [],
        statusFilter = null,
        error = null;

  MatchQueueState copyWith({
    MatchQueueStatus? status,
    List<MatchResultEntity>? items,
    String? statusFilter,
    String? error,
  }) {
    return MatchQueueState(
      status: status ?? this.status,
      items: items ?? this.items,
      statusFilter: statusFilter ?? this.statusFilter,
      error: error,
    );
  }

  @override
  List<Object?> get props => [status, items, statusFilter, error];
}

