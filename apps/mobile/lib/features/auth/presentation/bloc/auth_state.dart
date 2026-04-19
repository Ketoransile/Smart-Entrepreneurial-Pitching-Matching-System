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
  static const Object _unset = Object();

  final AuthStatus status;
  final UserEntity? user;
  final String? errorMessage;
  final bool isLoading;
  final String? successMessage;

  const AuthState({
    this.status = AuthStatus.initial,
    this.user,
    this.errorMessage,
    this.isLoading = false,
    this.successMessage,
  });

  const AuthState.initial()
      : status = AuthStatus.initial,
        user = null,
        errorMessage = null,
        isLoading = false,
        successMessage = null;

  const AuthState.loading()
      : status = AuthStatus.loading,
        user = null,
        errorMessage = null,
        isLoading = true,
        successMessage = null;

  const AuthState.authenticated(this.user)
      : status = AuthStatus.authenticated,
        errorMessage = null,
        isLoading = false,
        successMessage = null;

  const AuthState.unauthenticated({this.successMessage})
      : status = AuthStatus.unauthenticated,
        user = null,
        errorMessage = null,
        isLoading = false;

  const AuthState.emailVerificationRequired(this.user)
      : status = AuthStatus.emailVerificationRequired,
        errorMessage = null,
        isLoading = false,
        successMessage = null;

  const AuthState.error(this.errorMessage)
      : status = AuthStatus.error,
        user = null,
        isLoading = false,
        successMessage = null;

  // Convenience getters and copyWith allow the presentation layer to react to
  // small state deltas without manually copying fields every time.

  AuthState copyWith({
    AuthStatus? status,
    Object? user = _unset,
    Object? errorMessage = _unset,
    bool? isLoading,
    Object? successMessage = _unset,
  }) {
    return AuthState(
      status: status ?? this.status,
      user: identical(user, _unset) ? this.user : user as UserEntity?,
      errorMessage:
          identical(errorMessage, _unset) ? this.errorMessage : errorMessage as String?,
      isLoading: isLoading ?? this.isLoading,
      successMessage: identical(successMessage, _unset)
          ? this.successMessage
          : successMessage as String?,
    );
  }

  bool get isAuthenticated => status == AuthStatus.authenticated;
  bool get isUnauthenticated => status == AuthStatus.unauthenticated;
  bool get needsEmailVerification => status == AuthStatus.emailVerificationRequired;
  bool get hasError => status == AuthStatus.error;

  @override
  List<Object?> get props => [status, user, errorMessage, isLoading, successMessage];
}
