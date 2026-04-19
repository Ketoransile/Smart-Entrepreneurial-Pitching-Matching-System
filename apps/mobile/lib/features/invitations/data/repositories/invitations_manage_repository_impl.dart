import 'package:dartz/dartz.dart';

import '../../../../core/error/failures.dart';
import '../../domain/entities/invitation_entity.dart';
import '../../domain/repositories/invitations_manage_repository.dart';
import '../datasources/invitations_manage_remote_datasource.dart';

class InvitationsManageRepositoryImpl implements InvitationsManageRepository {
  final InvitationsManageRemoteDataSource _remote;
  InvitationsManageRepositoryImpl({required InvitationsManageRemoteDataSource remote})
      : _remote = remote;

  @override
  Future<Either<Failure, List<InvitationEntity>>> listMine({
    String? status,
    String? direction,
  }) async {
    try {
      final list = await _remote.listMine(status: status, direction: direction);
      return Right(list);
    } on Failure catch (e) {
      return Left(e);
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, InvitationEntity>> respond({
    required String invitationId,
    required String status,
    String? responseMessage,
  }) async {
    try {
      final inv = await _remote.respond(
        invitationId: invitationId,
        status: status,
        responseMessage: responseMessage,
      );
      return Right(inv);
    } on Failure catch (e) {
      return Left(e);
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, InvitationEntity>> cancel(String invitationId) async {
    try {
      final inv = await _remote.cancel(invitationId);
      return Right(inv);
    } on Failure catch (e) {
      return Left(e);
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }
}

