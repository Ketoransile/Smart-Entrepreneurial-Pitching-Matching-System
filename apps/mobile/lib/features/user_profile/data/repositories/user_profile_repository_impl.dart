import 'package:dartz/dartz.dart';

import '../../../../core/error/failures.dart';
import '../../domain/entities/user_profile_entity.dart';
import '../../domain/repositories/user_profile_repository.dart';
import '../datasources/user_profile_remote_datasource.dart';

class UserProfileRepositoryImpl implements UserProfileRepository {
  final UserProfileRemoteDataSource _remote;

  UserProfileRepositoryImpl({required UserProfileRemoteDataSource remote})
      : _remote = remote;

  @override
  Future<Either<Failure, UserProfileEntity>> getMyProfile() async {
    try {
      final profile = await _remote.getMyProfile();
      return Right(profile);
    } on Failure catch (e) {
      return Left(e);
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }
}

