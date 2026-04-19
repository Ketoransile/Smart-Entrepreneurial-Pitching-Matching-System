import 'package:dartz/dartz.dart';

import '../../../../core/error/failures.dart';
import '../entities/investor_profile_entity.dart';
import '../repositories/investor_profile_repository.dart';

class GetInvestorProfileUseCase {
  final InvestorProfileRepository _repo;
  GetInvestorProfileUseCase(this._repo);
  Future<Either<Failure, InvestorProfileEntity>> call() => _repo.getProfile();
}

class CreateInvestorProfileUseCase {
  final InvestorProfileRepository _repo;
  CreateInvestorProfileUseCase(this._repo);
  Future<Either<Failure, InvestorProfileEntity>> call(Map<String, dynamic> payload) =>
      _repo.createProfile(payload);
}

class UpdateInvestorProfileUseCase {
  final InvestorProfileRepository _repo;
  UpdateInvestorProfileUseCase(this._repo);
  Future<Either<Failure, InvestorProfileEntity>> call(Map<String, dynamic> payload) =>
      _repo.updateProfile(payload);
}

