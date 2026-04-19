import 'package:dartz/dartz.dart';

import '../../../../core/error/failures.dart';
import '../../domain/entities/entrepreneur_profile_entity.dart';
import '../../domain/repositories/entrepreneur_profile_repository.dart';
import '../datasources/entrepreneur_profile_remote_datasource.dart';

class EntrepreneurProfileRepositoryImpl implements EntrepreneurProfileRepository {
  final EntrepreneurProfileRemoteDataSource _remote;
  EntrepreneurProfileRepositoryImpl({required EntrepreneurProfileRemoteDataSource remote})
      : _remote = remote;

  @override
  Future<Either<Failure, bool>> hasProfile() async {
    try {
      final ok = await _remote.hasProfile();
      return Right(ok);
    } on Failure catch (e) {
      return Left(e);
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, EntrepreneurProfileEntity>> getProfile() async {
    try {
      final profile = await _remote.getProfile();
      return Right(profile);
    } on Failure catch (e) {
      return Left(e);
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, EntrepreneurProfileEntity>> createProfile({
    required String fullName,
    required String companyName,
    required String companyRegistrationNumber,
    required String businessSector,
    required String businessStage,
  }) async {
    try {
      final profile = await _remote.createProfile(
        fullName: fullName,
        companyName: companyName,
        companyRegistrationNumber: companyRegistrationNumber,
        businessSector: businessSector,
        businessStage: businessStage,
      );
      return Right(profile);
    } on Failure catch (e) {
      return Left(e);
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, EntrepreneurProfileEntity>> updateProfile(
    Map<String, dynamic> patch,
  ) async {
    try {
      final profile = await _remote.updateProfile(patch);
      return Right(profile);
    } on Failure catch (e) {
      return Left(e);
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }
}

