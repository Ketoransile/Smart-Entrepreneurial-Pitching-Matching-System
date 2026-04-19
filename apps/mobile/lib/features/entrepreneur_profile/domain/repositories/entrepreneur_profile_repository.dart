import 'package:dartz/dartz.dart';

import '../../../../core/error/failures.dart';
import '../entities/entrepreneur_profile_entity.dart';

abstract class EntrepreneurProfileRepository {
  Future<Either<Failure, bool>> hasProfile();
  Future<Either<Failure, EntrepreneurProfileEntity>> getProfile();
  Future<Either<Failure, EntrepreneurProfileEntity>> createProfile({
    required String fullName,
    required String companyName,
    required String companyRegistrationNumber,
    required String businessSector,
    required String businessStage,
  });
  Future<Either<Failure, EntrepreneurProfileEntity>> updateProfile(
    Map<String, dynamic> patch,
  );
}

