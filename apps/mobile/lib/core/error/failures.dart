import 'package:equatable/equatable.dart';

abstract class Failure extends Equatable {
  final String message;
  final String? code;

  const Failure({
    required this.message,
    this.code,
  });

  @override
  List<Object?> get props => [message, code];
}

class ServerFailure extends Failure {
  const ServerFailure({
    super.message = 'Server error occurred',
    super.code,
  });
}

class NetworkFailure extends Failure {
  const NetworkFailure({
    super.message = 'No internet connection',
    super.code,
  });
}

class AuthFailure extends Failure {
  const AuthFailure({
    required super.message,
    super.code,
  });

  factory AuthFailure.fromFirebaseCode(String code) {
    switch (code) {
      case 'user-not-found':
        return const AuthFailure(
          message: 'No user found with this email',
          code: 'user-not-found',
        );
      case 'wrong-password':
        return const AuthFailure(
          message: 'Incorrect password',
          code: 'wrong-password',
        );
      case 'invalid-email':
        return const AuthFailure(
          message: 'Invalid email address',
          code: 'invalid-email',
        );
      case 'user-disabled':
        return const AuthFailure(
          message: 'This account has been disabled',
          code: 'user-disabled',
        );
      case 'email-already-in-use':
        return const AuthFailure(
          message: 'An account already exists with this email',
          code: 'email-already-in-use',
        );
      case 'weak-password':
        return const AuthFailure(
          message: 'Password is too weak',
          code: 'weak-password',
        );
      case 'operation-not-allowed':
        return const AuthFailure(
          message: 'This operation is not allowed',
          code: 'operation-not-allowed',
        );
      case 'too-many-requests':
        return const AuthFailure(
          message: 'Too many attempts. Please try again later',
          code: 'too-many-requests',
        );
      case 'invalid-credential':
        return const AuthFailure(
          message: 'Invalid email or password',
          code: 'invalid-credential',
        );
      case 'account-exists-with-different-credential':
        return const AuthFailure(
          message: 'An account already exists with the same email but different sign-in credentials',
          code: 'account-exists-with-different-credential',
        );
      case 'requires-recent-login':
        return const AuthFailure(
          message: 'Please sign in again to complete this action',
          code: 'requires-recent-login',
        );
      default:
        return AuthFailure(
          message: 'Authentication failed: $code',
          code: code,
        );
    }
  }
}

class CacheFailure extends Failure {
  const CacheFailure({
    super.message = 'Cache error occurred',
    super.code,
  });
}

class ValidationFailure extends Failure {
  const ValidationFailure({
    required super.message,
    super.code,
  });
}
