import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../domain/entities/invitation_entity.dart';
import '../../domain/usecases/invitations_manage_usecases.dart';

part 'invitations_event.dart';
part 'invitations_state.dart';

class InvitationsBloc extends Bloc<InvitationsEvent, InvitationsState> {
  final ListMyInvitationsUseCase _list;
  final RespondToInvitationUseCase _respond;
  final CancelInvitationUseCase _cancel;

  InvitationsBloc({
    required ListMyInvitationsUseCase list,
    required RespondToInvitationUseCase respond,
    required CancelInvitationUseCase cancel,
  })  : _list = list,
        _respond = respond,
        _cancel = cancel,
        super(const InvitationsState.initial()) {
    on<InvitationsRequested>(_onList);
    on<InvitationRespondRequested>(_onRespond);
    on<InvitationCancelRequested>(_onCancel);
  }

  Future<void> _onList(
    InvitationsRequested event,
    Emitter<InvitationsState> emit,
  ) async {
    emit(state.copyWith(status: InvitationsStatus.loading, error: null));
    final result = await _list(status: event.status, direction: event.direction);
    result.fold(
      (f) => emit(state.copyWith(status: InvitationsStatus.error, error: f.message)),
      (items) => emit(state.copyWith(
        status: InvitationsStatus.loaded,
        items: items,
        direction: event.direction,
        statusFilter: event.status,
      )),
    );
  }

  Future<void> _onRespond(
    InvitationRespondRequested event,
    Emitter<InvitationsState> emit,
  ) async {
    emit(state.copyWith(status: InvitationsStatus.loading, error: null));
    final result = await _respond(
      invitationId: event.invitationId,
      status: event.status,
      responseMessage: event.responseMessage,
    );
    result.fold(
      (f) => emit(state.copyWith(status: InvitationsStatus.error, error: f.message)),
      (_) => add(InvitationsRequested(
        status: state.statusFilter,
        direction: state.direction,
      )),
    );
  }

  Future<void> _onCancel(
    InvitationCancelRequested event,
    Emitter<InvitationsState> emit,
  ) async {
    emit(state.copyWith(status: InvitationsStatus.loading, error: null));
    final result = await _cancel(event.invitationId);
    result.fold(
      (f) => emit(state.copyWith(status: InvitationsStatus.error, error: f.message)),
      (_) => add(InvitationsRequested(
        status: state.statusFilter,
        direction: state.direction,
      )),
    );
  }
}

