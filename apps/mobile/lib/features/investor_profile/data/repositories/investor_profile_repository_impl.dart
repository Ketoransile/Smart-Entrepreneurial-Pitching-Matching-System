import 'package:dartz/dartz.dart';

import '../../../../core/error/failures.dart';
import '../../domain/entities/investor_profile_entity.dart';
import '../../domain/repositories/investor_profile_repository.dart';
import '../datasources/investor_profile_remote_datasource.dart';

class InvestorProfileRepositoryImpl implements InvestorProfileRepository {
  final InvestorProfileRemoteDataSource _remote;
  InvestorProfileRepositoryImpl({required InvestorProfileRemoteDataSource remote})
      : _remote = remote;

  @override
  Future<Either<Failure, InvestorProfileEntity>> getProfile() async {
    try {
      final p = await _remote.getProfile();
      return Right(p);
    } on Failure catch (e) {
      return Left(e);
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, InvestorProfileEntity>> createProfile(
    Map<String, dynamic> payload,
  ) async {
    try {
      final p = await _remote.createProfile(payload);
      return Right(p);
    } on Failure catch (e) {
      return Left(e);
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, InvestorProfileEntity>> updateProfile(
    Map<String, dynamic> payload,
  ) async {
    try {
      final p = await _remote.updateProfile(payload);
      return Right(p);
    } on Failure catch (e) {
      return Left(e);
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }
}

