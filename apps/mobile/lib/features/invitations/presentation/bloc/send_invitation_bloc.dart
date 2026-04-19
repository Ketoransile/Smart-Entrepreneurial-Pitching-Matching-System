import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../domain/entities/invitation_entity.dart';
import '../../domain/usecases/send_invitation_usecase.dart';

part 'send_invitation_event.dart';
part 'send_invitation_state.dart';

class SendInvitationBloc extends Bloc<SendInvitationEvent, SendInvitationState> {
  final SendInvitationUseCase _send;
  SendInvitationBloc({required SendInvitationUseCase send})
      : _send = send,
        super(const SendInvitationState.initial()) {
    on<SendInvitationRequested>(_onSend);
  }

  Future<void> _onSend(
    SendInvitationRequested event,
    Emitter<SendInvitationState> emit,
  ) async {
    emit(state.copyWith(status: SendInvitationStatus.loading, error: null));
    final result = await _send(
      matchId: event.matchId,
      message: event.message,
      expiresInDays: event.expiresInDays,
    );
    result.fold(
      (f) => emit(state.copyWith(status: SendInvitationStatus.error, error: f.message)),
      (inv) => emit(state.copyWith(status: SendInvitationStatus.sent, invitation: inv)),
    );
  }
}

