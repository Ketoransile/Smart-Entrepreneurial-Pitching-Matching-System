part of 'send_invitation_bloc.dart';

abstract class SendInvitationEvent extends Equatable {
  const SendInvitationEvent();
  @override
  List<Object?> get props => [];
}

class SendInvitationRequested extends SendInvitationEvent {
  final String matchId;
  final String message;
  final int? expiresInDays;

  const SendInvitationRequested({
    required this.matchId,
    required this.message,
    this.expiresInDays,
  });

  @override
  List<Object?> get props => [matchId, message, expiresInDays];
}

