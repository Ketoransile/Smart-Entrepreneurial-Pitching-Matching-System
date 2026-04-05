import 'package:equatable/equatable.dart';
import '../../domain/entities/user_entity.dart';

abstract class AuthEvent extends Equatable {
  const AuthEvent();

  @override
  List<Object?> get props => [];
}

class AuthCheckRequested extends AuthEvent {
  const AuthCheckRequested();
}

class AuthStateChanged extends AuthEvent {
  final UserEntity? user;

  const AuthStateChanged(this.user);

  @override
  List<Object?> get props => [user];
}

class SignUpRequested extends AuthEvent {
  final String email;
  final String password;
  final String fullName;
  final UserRole role;
  final String? companyName;
  final String? fundName;

  const SignUpRequested({
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

class SignInRequested extends AuthEvent {
  final String email;
  final String password;

  const SignInRequested({
    required this.email,
    required this.password,
  });

  @override
  List<Object?> get props => [email, password];
}

class GoogleSignInRequested extends AuthEvent {
  final UserRole role;
  final String? companyName;
  final String? fundName;

  const GoogleSignInRequested({
    required this.role,
    this.companyName,
    this.fundName,
  });

  @override
  List<Object?> get props => [role, companyName, fundName];
}

class SignOutRequested extends AuthEvent {
  const SignOutRequested();
}

class ResendVerificationRequested extends AuthEvent {
  const ResendVerificationRequested();
}

class RefreshUserRequested extends AuthEvent {
  const RefreshUserRequested();
}

class PasswordResetRequested extends AuthEvent {
  final String email;

  const PasswordResetRequested({required this.email});

  @override
  List<Object?> get props => [email];
}

class ClearFeedbackRequested extends AuthEvent {
  const ClearFeedbackRequested();
}
