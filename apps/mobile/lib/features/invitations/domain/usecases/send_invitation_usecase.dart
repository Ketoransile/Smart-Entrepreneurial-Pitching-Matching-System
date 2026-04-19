import 'package:dartz/dartz.dart';

import '../../../../core/error/failures.dart';
import '../entities/invitation_entity.dart';
import '../repositories/invitations_repository.dart';

class SendInvitationUseCase {
  final InvitationsRepository _repo;
  SendInvitationUseCase(this._repo);

  Future<Either<Failure, InvitationEntity>> call({
    required String matchId,
    required String message,
    int? expiresInDays,
  }) =>
      _repo.sendInvitation(
        matchId: matchId,
        message: message,
        expiresInDays: expiresInDays,
      );
}

