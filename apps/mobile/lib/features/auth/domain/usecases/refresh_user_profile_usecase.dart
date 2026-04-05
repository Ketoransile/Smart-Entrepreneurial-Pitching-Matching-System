import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../entities/user_entity.dart';
import '../repositories/auth_repository.dart';

class RefreshUserProfileUseCase {
  final AuthRepository repository;

  RefreshUserProfileUseCase(this.repository);

  Future<Either<Failure, UserEntity>> call() {
    return repository.refreshUserProfile();
  }
}
