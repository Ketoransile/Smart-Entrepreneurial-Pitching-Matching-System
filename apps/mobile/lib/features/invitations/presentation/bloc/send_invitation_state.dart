part of 'send_invitation_bloc.dart';

enum SendInvitationStatus { initial, loading, sent, error }

class SendInvitationState extends Equatable {
  final SendInvitationStatus status;
  final InvitationEntity? invitation;
  final String? error;

  const SendInvitationState({
    required this.status,
    this.invitation,
    this.error,
  });

  const SendInvitationState.initial()
      : status = SendInvitationStatus.initial,
        invitation = null,
        error = null;

  SendInvitationState copyWith({
    SendInvitationStatus? status,
    InvitationEntity? invitation,
    String? error,
  }) {
    return SendInvitationState(
      status: status ?? this.status,
      invitation: invitation ?? this.invitation,
      error: error,
    );
  }

  bool get isLoading => status == SendInvitationStatus.loading;

  @override
  List<Object?> get props => [status, invitation, error];
}

