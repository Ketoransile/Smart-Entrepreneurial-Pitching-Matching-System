part of 'invitations_bloc.dart';

abstract class InvitationsEvent extends Equatable {
  const InvitationsEvent();
  @override
  List<Object?> get props => [];
}

class InvitationsRequested extends InvitationsEvent {
  final String? status;
  final String? direction; // sent|received|all
  const InvitationsRequested({this.status, this.direction});
  @override
  List<Object?> get props => [status, direction];
}

class InvitationRespondRequested extends InvitationsEvent {
  final String invitationId;
  final String status; // accepted|declined
  final String? responseMessage;
  const InvitationRespondRequested({
    required this.invitationId,
    required this.status,
    this.responseMessage,
  });
  @override
  List<Object?> get props => [invitationId, status, responseMessage];
}

class InvitationCancelRequested extends InvitationsEvent {
  final String invitationId;
  const InvitationCancelRequested(this.invitationId);
  @override
  List<Object?> get props => [invitationId];
}

