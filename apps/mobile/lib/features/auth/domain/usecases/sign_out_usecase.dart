import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../repositories/auth_repository.dart';

class SignOutUseCase {
  final AuthRepository repository;

  SignOutUseCase(this.repository);

  Future<Either<Failure, Unit>> call() {
    // Invokes repository signOut to end the current session and clear caches.
    return repository.signOut();
  }
}
