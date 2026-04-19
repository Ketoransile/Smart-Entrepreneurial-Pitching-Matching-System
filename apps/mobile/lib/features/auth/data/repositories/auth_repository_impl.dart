import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../../domain/entities/user_entity.dart';
import '../../domain/repositories/auth_repository.dart';
import '../datasources/auth_local_datasource.dart';
import '../datasources/auth_remote_datasource.dart';
import '../models/user_model.dart';

class AuthRepositoryImpl implements AuthRepository {
  final AuthRemoteDataSource _remoteDataSource;
  final AuthLocalDataSource _localDataSource;

  /// Implementation of `AuthRepository` that composes remote and local data
  /// sources. Remote calls are attempted first and results are cached locally.

  AuthRepositoryImpl({
    required AuthRemoteDataSource remoteDataSource,
    required AuthLocalDataSource localDataSource,
  })  : _remoteDataSource = remoteDataSource,
        _localDataSource = localDataSource;

  @override
  Future<Either<Failure, UserEntity>> signUp({
    required String email,
    required String password,
    required String fullName,
    required UserRole role,
    String? companyName,
    String? fundName,
  }) async {
    try {
      final user = await _remoteDataSource.signUp(
        email: email,
        password: password,
        fullName: fullName,
        role: role,
        companyName: companyName,
        fundName: fundName,
      );

      await _localDataSource.cacheUser(user);
      return Right(user);
    } on AuthFailure catch (e) {
      return Left(e);
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, UserEntity>> signIn({
    required String email,
    required String password,
  }) async {
    try {
      final user = await _remoteDataSource.signIn(
        email: email,
        password: password,
      );

      await _localDataSource.cacheUser(user);
      return Right(user);
    } on AuthFailure catch (e) {
      return Left(e);
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, UserEntity>> signInWithGoogle({
    required UserRole role,
    String? companyName,
    String? fundName,
  }) async {
    try {
      final user = await _remoteDataSource.signInWithGoogle(
        role: role,
        companyName: companyName,
        fundName: fundName,
      );

      await _localDataSource.cacheUser(user);
      return Right(user);
    } on AuthFailure catch (e) {
      return Left(e);
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, Unit>> signOut() async {
    try {
      await _remoteDataSource.signOut();
      await _localDataSource.clearCache();
      return const Right(unit);
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, UserEntity>> getCurrentUser() async {
    try {
      final user = await _remoteDataSource.getCurrentUser();
      if (user != null) {
        await _localDataSource.cacheUser(user);
        return Right(user);
      }

      final cachedUser = await _localDataSource.getCachedUser();
      if (cachedUser != null) {
        return Right(cachedUser);
      }

      return const Left(AuthFailure(message: 'No user found'));
    } on Failure catch (e) {
      return Left(e);
    } catch (e) {
      final cachedUser = await _localDataSource.getCachedUser();
      if (cachedUser != null) {
        return Right(cachedUser);
      }
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Stream<UserEntity?> get authStateChanges {
    return _remoteDataSource.authStateChanges.asyncMap((firebaseUser) async {
      if (firebaseUser == null) {
        await _localDataSource.clearCache();
        return null;
      }

      try {
        final user = await _remoteDataSource.getCurrentUser();
        if (user != null) {
          await _localDataSource.cacheUser(user);
          return user;
        }
      } catch (_) {}

      return _localDataSource.getCachedUser();
    });
  }

  @override
  Future<Either<Failure, Unit>> resendEmailVerification() async {
    try {
      await _remoteDataSource.resendEmailVerification();
      return const Right(unit);
    } on AuthFailure catch (e) {
      return Left(e);
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, UserEntity>> refreshUserProfile() async {
    try {
      final user = await _remoteDataSource.refreshUserProfile();
      await _localDataSource.cacheUser(user);
      return Right(user);
    } on AuthFailure catch (e) {
      return Left(e);
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  bool get isSignedIn => _remoteDataSource.currentFirebaseUser != null;

  @override
  Future<Either<Failure, Unit>> sendPasswordResetEmail(String email) async {
    try {
      await _remoteDataSource.sendPasswordResetEmail(email);
      return const Right(unit);
    } on AuthFailure catch (e) {
      return Left(e);
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }
}
