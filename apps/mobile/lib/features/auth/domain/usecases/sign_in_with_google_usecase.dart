import 'package:dartz/dartz.dart';
import 'package:equatable/equatable.dart';
import '../../../../core/error/failures.dart';
import '../entities/user_entity.dart';
import '../repositories/auth_repository.dart';

class SignInWithGoogleUseCase {
  final AuthRepository repository;

  SignInWithGoogleUseCase(this.repository);

  Future<Either<Failure, UserEntity>> call(SignInWithGoogleParams params) {
    // Handles Google sign-in flow parameters and maps them to the repository.
    return repository.signInWithGoogle(
      role: params.role,
      companyName: params.companyName,
      fundName: params.fundName,
    );
  }
}

class SignInWithGoogleParams extends Equatable {
  final UserRole role;
  final String? companyName;
  final String? fundName;

  const SignInWithGoogleParams({
    required this.role,
    this.companyName,
    this.fundName,
  });

  @override
  List<Object?> get props => [role, companyName, fundName];
}
