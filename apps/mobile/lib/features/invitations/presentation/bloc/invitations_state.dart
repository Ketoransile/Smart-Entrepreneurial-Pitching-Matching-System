part of 'invitations_bloc.dart';

enum InvitationsStatus { initial, loading, loaded, error }

class InvitationsState extends Equatable {
  final InvitationsStatus status;
  final List<InvitationEntity> items;
  final String? direction;
  final String? statusFilter;
  final String? error;

  const InvitationsState({
    required this.status,
    this.items = const [],
    this.direction,
    this.statusFilter,
    this.error,
  });

  const InvitationsState.initial()
      : status = InvitationsStatus.initial,
        items = const [],
        direction = 'all',
        statusFilter = null,
        error = null;

  InvitationsState copyWith({
    InvitationsStatus? status,
    List<InvitationEntity>? items,
    String? direction,
    String? statusFilter,
    String? error,
  }) {
    return InvitationsState(
      status: status ?? this.status,
      items: items ?? this.items,
      direction: direction ?? this.direction,
      statusFilter: statusFilter ?? this.statusFilter,
      error: error,
    );
  }

  bool get isLoading => status == InvitationsStatus.loading;

  @override
  List<Object?> get props => [status, items, direction, statusFilter, error];
}

