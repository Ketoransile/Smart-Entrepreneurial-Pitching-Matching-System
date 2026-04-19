import 'package:dartz/dartz.dart';

import '../../../../core/error/failures.dart';
import '../entities/entrepreneur_profile_entity.dart';
import '../repositories/entrepreneur_profile_repository.dart';

class HasEntrepreneurProfileUseCase {
  final EntrepreneurProfileRepository _repo;
  HasEntrepreneurProfileUseCase(this._repo);
  Future<Either<Failure, bool>> call() => _repo.hasProfile();
}

class GetEntrepreneurProfileUseCase {
  final EntrepreneurProfileRepository _repo;
  GetEntrepreneurProfileUseCase(this._repo);
  Future<Either<Failure, EntrepreneurProfileEntity>> call() => _repo.getProfile();
}

class CreateEntrepreneurProfileUseCase {
  final EntrepreneurProfileRepository _repo;
  CreateEntrepreneurProfileUseCase(this._repo);
  Future<Either<Failure, EntrepreneurProfileEntity>> call({
    required String fullName,
    required String companyName,
    required String companyRegistrationNumber,
    required String businessSector,
    required String businessStage,
  }) {
    return _repo.createProfile(
      fullName: fullName,
      companyName: companyName,
      companyRegistrationNumber: companyRegistrationNumber,
      businessSector: businessSector,
      businessStage: businessStage,
    );
  }
}

class UpdateEntrepreneurProfileUseCase {
  final EntrepreneurProfileRepository _repo;
  UpdateEntrepreneurProfileUseCase(this._repo);
  Future<Either<Failure, EntrepreneurProfileEntity>> call(
    Map<String, dynamic> patch,
  ) =>
      _repo.updateProfile(patch);
}

