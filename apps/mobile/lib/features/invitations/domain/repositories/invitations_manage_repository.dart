import 'package:dartz/dartz.dart';

import '../../../../core/error/failures.dart';
import '../entities/invitation_entity.dart';

abstract class InvitationsManageRepository {
  Future<Either<Failure, List<InvitationEntity>>> listMine({
    String? status,
    String? direction,
  });

  Future<Either<Failure, InvitationEntity>> respond({
    required String invitationId,
    required String status,
    String? responseMessage,
  });

  Future<Either<Failure, InvitationEntity>> cancel(String invitationId);
}

