part of 'milestones_bloc.dart';

enum MilestonesStatus { initial, loading, loaded, error }

class MilestonesState extends Equatable {
  final MilestonesStatus status;
  final List<MilestoneEntity> items;
  final String? error;

  const MilestonesState({
    required this.status,
    this.items = const [],
    this.error,
  });

  const MilestonesState.initial()
      : status = MilestonesStatus.initial,
        items = const [],
        error = null;

  MilestonesState copyWith({
    MilestonesStatus? status,
    List<MilestoneEntity>? items,
    String? error,
  }) {
    return MilestonesState(
      status: status ?? this.status,
      items: items ?? this.items,
      error: error,
    );
  }

  bool get isLoading => status == MilestonesStatus.loading;

  @override
  List<Object?> get props => [status, items, error];
}

