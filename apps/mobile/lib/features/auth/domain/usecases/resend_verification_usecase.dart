import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../repositories/auth_repository.dart';

class ResendVerificationUseCase {
  final AuthRepository repository;

  ResendVerificationUseCase(this.repository);

  Future<Either<Failure, Unit>> call() {
    // Requests the repository to resend the verification email for the
    // currently authenticated user (if any).
    return repository.resendEmailVerification();
  }
}
