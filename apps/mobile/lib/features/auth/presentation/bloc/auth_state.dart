import 'package:equatable/equatable.dart';
import '../../domain/entities/user_entity.dart';

enum AuthStatus {
  initial,
  loading,
  authenticated,
  unauthenticated,
  emailVerificationRequired,
  error,
}

class AuthState extends Equatable {
  final AuthStatus status;
  final UserEntity? user;
  final String? errorMessage;
  final bool isLoading;

  const AuthState({
    this.status = AuthStatus.initial,
    this.user,
    this.errorMessage,
    this.isLoading = false,
  });

  const AuthState.initial()
      : status = AuthStatus.initial,
        user = null,
        errorMessage = null,
        isLoading = false;

  const AuthState.loading()
      : status = AuthStatus.loading,
        user = null,
        errorMessage = null,
        isLoading = true;

  const AuthState.authenticated(this.user)
      : status = AuthStatus.authenticated,
        errorMessage = null,
        isLoading = false;

  const AuthState.unauthenticated()
      : status = AuthStatus.unauthenticated,
        user = null,
        errorMessage = null,
        isLoading = false;

  const AuthState.emailVerificationRequired(this.user)
      : status = AuthStatus.emailVerificationRequired,
        errorMessage = null,
        isLoading = false;

  const AuthState.error(this.errorMessage)
      : status = AuthStatus.error,
        user = null,
        isLoading = false;

  AuthState copyWith({
    AuthStatus? status,
    UserEntity? user,
    String? errorMessage,
    bool? isLoading,
  }) {
    return AuthState(
      status: status ?? this.status,
      user: user ?? this.user,
      errorMessage: errorMessage ?? this.errorMessage,
      isLoading: isLoading ?? this.isLoading,
    );
  }

  bool get isAuthenticated => status == AuthStatus.authenticated;
  bool get isUnauthenticated => status == AuthStatus.unauthenticated;
  bool get needsEmailVerification => status == AuthStatus.emailVerificationRequired;
  bool get hasError => status == AuthStatus.error;

  @override
  List<Object?> get props => [status, user, errorMessage, isLoading];
}
