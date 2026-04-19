import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../entities/user_entity.dart';
import '../repositories/auth_repository.dart';

class GetCurrentUserUseCase {
  final AuthRepository repository;

  GetCurrentUserUseCase(this.repository);

  Future<Either<Failure, UserEntity>> call() {
    /// Fetches the current authenticated user, preferring fresh data from
    /// the repository and falling back to cached data if available.
    return repository.getCurrentUser();
  }
}
