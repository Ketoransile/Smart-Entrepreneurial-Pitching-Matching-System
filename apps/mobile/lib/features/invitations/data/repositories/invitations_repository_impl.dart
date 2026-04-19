import 'package:dartz/dartz.dart';

import '../../../../core/error/failures.dart';
import '../../domain/entities/invitation_entity.dart';
import '../../domain/repositories/invitations_repository.dart';
import '../datasources/invitations_remote_datasource.dart';

class InvitationsRepositoryImpl implements InvitationsRepository {
  final InvitationsRemoteDataSource _remote;
  InvitationsRepositoryImpl({required InvitationsRemoteDataSource remote}) : _remote = remote;

  @override
  Future<Either<Failure, InvitationEntity>> sendInvitation({
    required String matchId,
    required String message,
    int? expiresInDays,
  }) async {
    try {
      final inv = await _remote.sendInvitation(
        matchId: matchId,
        message: message,
        expiresInDays: expiresInDays,
      );
      return Right(inv);
    } on Failure catch (e) {
      return Left(e);
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }
}

