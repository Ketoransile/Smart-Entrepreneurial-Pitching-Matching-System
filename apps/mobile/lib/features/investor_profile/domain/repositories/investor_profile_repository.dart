import 'package:dartz/dartz.dart';

import '../../../../core/error/failures.dart';
import '../entities/investor_profile_entity.dart';

abstract class InvestorProfileRepository {
  Future<Either<Failure, InvestorProfileEntity>> getProfile();
  Future<Either<Failure, InvestorProfileEntity>> createProfile(
    Map<String, dynamic> payload,
  );
  Future<Either<Failure, InvestorProfileEntity>> updateProfile(
    Map<String, dynamic> payload,
  );
}

