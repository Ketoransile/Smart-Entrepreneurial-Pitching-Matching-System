part of 'meetings_bloc.dart';

enum MeetingsStatus { initial, loading, loaded, error }

class MeetingsState extends Equatable {
  final MeetingsStatus status;
  final List<MeetingEntity> items;
  final String? statusFilter;
  final String? error;

  const MeetingsState({
    required this.status,
    this.items = const [],
    this.statusFilter,
    this.error,
  });

  const MeetingsState.initial()
      : status = MeetingsStatus.initial,
        items = const [],
        statusFilter = null,
        error = null;

  MeetingsState copyWith({
    MeetingsStatus? status,
    List<MeetingEntity>? items,
    String? statusFilter,
    String? error,
  }) {
    return MeetingsState(
      status: status ?? this.status,
      items: items ?? this.items,
      statusFilter: statusFilter ?? this.statusFilter,
      error: error,
    );
  }

  bool get isLoading => status == MeetingsStatus.loading;

  @override
  List<Object?> get props => [status, items, statusFilter, error];
}

