import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../entities/user_entity.dart';

abstract class AuthRepository {
  /// Sign up with email and password
  Future<Either<Failure, UserEntity>> signUp({
    required String email,
    required String password,
    required String fullName,
    required UserRole role,
    String? companyName,
    String? fundName,
  });

  /// Sign in with email and password
  Future<Either<Failure, UserEntity>> signIn({
    required String email,
    required String password,
  });

  /// Sign in with Google
  Future<Either<Failure, UserEntity>> signInWithGoogle({
    required UserRole role,
    String? companyName,
    String? fundName,
  });

  /// Sign out
  Future<Either<Failure, Unit>> signOut();

  /// Get current authenticated user
  Future<Either<Failure, UserEntity>> getCurrentUser();

  /// Stream of auth state changes
  Stream<UserEntity?> get authStateChanges;

  /// Resend email verification
  Future<Either<Failure, Unit>> resendEmailVerification();

  /// Refresh user profile from backend
  Future<Either<Failure, UserEntity>> refreshUserProfile();

  /// Check if user is signed in
  bool get isSignedIn;

  /// Send password reset email
  Future<Either<Failure, Unit>> sendPasswordResetEmail(String email);
}
