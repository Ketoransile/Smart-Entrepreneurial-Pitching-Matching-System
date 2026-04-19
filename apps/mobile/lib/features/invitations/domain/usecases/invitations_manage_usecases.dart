import 'package:dartz/dartz.dart';

import '../../../../core/error/failures.dart';
import '../entities/invitation_entity.dart';
import '../repositories/invitations_manage_repository.dart';

class ListMyInvitationsUseCase {
  final InvitationsManageRepository _repo;
  ListMyInvitationsUseCase(this._repo);
  Future<Either<Failure, List<InvitationEntity>>> call({
    String? status,
    String? direction,
  }) =>
      _repo.listMine(status: status, direction: direction);
}

class RespondToInvitationUseCase {
  final InvitationsManageRepository _repo;
  RespondToInvitationUseCase(this._repo);
  Future<Either<Failure, InvitationEntity>> call({
    required String invitationId,
    required String status,
    String? responseMessage,
  }) =>
      _repo.respond(
        invitationId: invitationId,
        status: status,
        responseMessage: responseMessage,
      );
}

class CancelInvitationUseCase {
  final InvitationsManageRepository _repo;
  CancelInvitationUseCase(this._repo);
  Future<Either<Failure, InvitationEntity>> call(String invitationId) =>
      _repo.cancel(invitationId);
}

