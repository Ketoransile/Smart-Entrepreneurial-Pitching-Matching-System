import 'package:dartz/dartz.dart';
import 'package:equatable/equatable.dart';
import '../../../../core/error/failures.dart';
import '../entities/user_entity.dart';
import '../repositories/auth_repository.dart';

class SignUpUseCase {
  final AuthRepository repository;

  SignUpUseCase(this.repository);

  Future<Either<Failure, UserEntity>> call(SignUpParams params) {
    // Routes sign-up params to the authentication repository which handles
    // user creation, backend registration and caching.
    return repository.signUp(
      email: params.email,
      password: params.password,
      fullName: params.fullName,
      role: params.role,
      companyName: params.companyName,
      fundName: params.fundName,
    );
  }
}

class SignUpParams extends Equatable {
  final String email;
  final String password;
  final String fullName;
  final UserRole role;
  final String? companyName;
  final String? fundName;

  const SignUpParams({
    required this.email,
    required this.password,
    required this.fullName,
    required this.role,
    this.companyName,
    this.fundName,
  });

  @override
  List<Object?> get props => [email, password, fullName, role, companyName, fundName];
}
