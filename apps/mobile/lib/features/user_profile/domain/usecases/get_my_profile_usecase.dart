import 'package:dartz/dartz.dart';

import '../../../../core/error/failures.dart';
import '../entities/user_profile_entity.dart';
import '../repositories/user_profile_repository.dart';

class GetMyProfileUseCase {
  final UserProfileRepository _repo;
  GetMyProfileUseCase(this._repo);

  Future<Either<Failure, UserProfileEntity>> call() => _repo.getMyProfile();
}

