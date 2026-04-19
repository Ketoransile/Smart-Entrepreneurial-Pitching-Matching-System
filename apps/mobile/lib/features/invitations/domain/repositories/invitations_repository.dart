import 'package:dartz/dartz.dart';

import '../../../../core/error/failures.dart';
import '../entities/invitation_entity.dart';

abstract class InvitationsRepository {
  Future<Either<Failure, InvitationEntity>> sendInvitation({
    required String matchId,
    required String message,
    int? expiresInDays,
  });
}

