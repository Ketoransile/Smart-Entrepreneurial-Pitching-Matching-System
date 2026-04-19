import 'package:dartz/dartz.dart';

import '../../../../core/error/failures.dart';
import '../entities/user_profile_entity.dart';

abstract class UserProfileRepository {
  Future<Either<Failure, UserProfileEntity>> getMyProfile();
}

