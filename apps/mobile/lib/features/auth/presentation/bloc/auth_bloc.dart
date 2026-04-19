import 'dart:async';

import 'package:flutter_bloc/flutter_bloc.dart';
import '../../domain/entities/user_entity.dart';
import '../../domain/usecases/usecases.dart';
import 'auth_event.dart';
import 'auth_state.dart';

class AuthBloc extends Bloc<AuthEvent, AuthState> {
  /// Coordinates authentication flows between UI and domain layer.
  /// Receives `AuthEvent`s (user actions or state changes) and emits
  /// `AuthState`s representing the current authentication status.
  final SignInUseCase _signIn;
  final SignUpUseCase _signUp;
  final SignInWithGoogleUseCase _signInWithGoogle;
  final SignOutUseCase _signOut;
  final GetCurrentUserUseCase _getCurrentUser;
  final ResendVerificationUseCase _resendVerification;
  final RefreshUserProfileUseCase _refreshUserProfile;
  final SendPasswordResetEmailUseCase _sendPasswordResetEmail;

  StreamSubscription<UserEntity?>? _authStateSubscription;

  AuthBloc({
    required SignInUseCase signIn,
    required SignUpUseCase signUp,
    required SignInWithGoogleUseCase signInWithGoogle,
    required SignOutUseCase signOut,
    required GetCurrentUserUseCase getCurrentUser,
    required ResendVerificationUseCase resendVerification,
    required RefreshUserProfileUseCase refreshUserProfile,
    required SendPasswordResetEmailUseCase sendPasswordResetEmail,
    required Stream<UserEntity?> authStateChanges,
  })  : _signIn = signIn,
        _signUp = signUp,
        _signInWithGoogle = signInWithGoogle,
        _signOut = signOut,
        _getCurrentUser = getCurrentUser,
        _resendVerification = resendVerification,
        _refreshUserProfile = refreshUserProfile,
        _sendPasswordResetEmail = sendPasswordResetEmail,
        super(const AuthState.initial()) {
    _authStateSubscription = authStateChanges.listen((user) {
      add(AuthStateChanged(user));
    });
    on<AuthCheckRequested>(_onAuthCheckRequested);
    on<AuthStateChanged>(_onAuthStateChanged);
    on<SignUpRequested>(_onSignUpRequested);
    on<SignInRequested>(_onSignInRequested);
    on<GoogleSignInRequested>(_onGoogleSignInRequested);
    on<SignOutRequested>(_onSignOutRequested);
    on<ResendVerificationRequested>(_onResendVerificationRequested);
    on<RefreshUserRequested>(_onRefreshUserRequested);
    on<PasswordResetRequested>(_onPasswordResetRequested);
    on<ClearFeedbackRequested>(_onClearFeedbackRequested);
  }

  @override
  Future<void> close() {
    _authStateSubscription?.cancel();
    return super.close();
  }

  /// Clears stale feedback and marks a pending auth call without switching to
  /// [AuthStatus.loading] (so [AuthWrapper] does not show the splash screen).
  void _emitPendingAuthAction(Emitter<AuthState> emit) {
    emit(state.copyWith(
      isLoading: true,
      errorMessage: null,
      successMessage: null,
      status: state.status == AuthStatus.error ? AuthStatus.unauthenticated : state.status,
    ));
  }

  Future<void> _onAuthCheckRequested(
    AuthCheckRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(const AuthState.loading());

    final result = await _getCurrentUser();

    result.fold(
      (failure) => emit(const AuthState.unauthenticated()),
      (user) {
        if (!user.emailVerified) {
          emit(AuthState.emailVerificationRequired(user));
        } else {
          emit(AuthState.authenticated(user));
        }
      },
    );
  }

  void _onAuthStateChanged(
    AuthStateChanged event,
    Emitter<AuthState> emit,
  ) {
    if (event.user == null) {
      emit(const AuthState.unauthenticated());
    } else if (!event.user!.emailVerified) {
      emit(AuthState.emailVerificationRequired(event.user));
    } else {
      emit(AuthState.authenticated(event.user));
    }
  }

  Future<void> _onSignUpRequested(
    SignUpRequested event,
    Emitter<AuthState> emit,
  ) async {
    _emitPendingAuthAction(emit);

    final result = await _signUp(SignUpParams(
      email: event.email,
      password: event.password,
      fullName: event.fullName,
      role: event.role,
      companyName: event.companyName,
      fundName: event.fundName,
    ));

    result.fold(
      (failure) => emit(AuthState.error(failure.message)),
      (user) => emit(AuthState.emailVerificationRequired(user)),
    );
  }

  Future<void> _onSignInRequested(
    SignInRequested event,
    Emitter<AuthState> emit,
  ) async {
    _emitPendingAuthAction(emit);

    final result = await _signIn(SignInParams(
      email: event.email,
      password: event.password,
    ));

    result.fold(
      (failure) => emit(AuthState.error(failure.message)),
      (user) {
        if (!user.emailVerified) {
          emit(AuthState.emailVerificationRequired(user));
        } else {
          emit(AuthState.authenticated(user));
        }
      },
    );
  }

  Future<void> _onGoogleSignInRequested(
    GoogleSignInRequested event,
    Emitter<AuthState> emit,
  ) async {
    _emitPendingAuthAction(emit);

    final result = await _signInWithGoogle(SignInWithGoogleParams(
      role: event.role,
      companyName: event.companyName,
      fundName: event.fundName,
    ));

    result.fold(
      (failure) => emit(AuthState.error(failure.message)),
      (user) => emit(AuthState.authenticated(user)),
    );
  }

  Future<void> _onSignOutRequested(
    SignOutRequested event,
    Emitter<AuthState> emit,
  ) async {
    _emitPendingAuthAction(emit);

    final result = await _signOut();

    result.fold(
      (failure) => emit(AuthState.error(failure.message)),
      (_) => emit(const AuthState.unauthenticated()),
    );
  }

  Future<void> _onResendVerificationRequested(
    ResendVerificationRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(state.copyWith(
      isLoading: true,
      errorMessage: null,
    ));

    final result = await _resendVerification();

    result.fold(
      (failure) => emit(state.copyWith(
        isLoading: false,
        errorMessage: failure.message,
      )),
      (_) => emit(state.copyWith(
        isLoading: false,
        errorMessage: null,
      )),
    );
  }

  Future<void> _onRefreshUserRequested(
    RefreshUserRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(state.copyWith(
      isLoading: true,
      errorMessage: null,
    ));

    final result = await _refreshUserProfile();

    result.fold(
      (failure) => emit(state.copyWith(
        isLoading: false,
        errorMessage: failure.message,
      )),
      (user) {
        if (!user.emailVerified) {
          emit(AuthState.emailVerificationRequired(user));
        } else {
          emit(AuthState.authenticated(user));
        }
      },
    );
  }

  Future<void> _onPasswordResetRequested(
    PasswordResetRequested event,
    Emitter<AuthState> emit,
  ) async {
    _emitPendingAuthAction(emit);

    final result = await _sendPasswordResetEmail(event.email);

    result.fold(
      (failure) => emit(AuthState.error(failure.message)),
      (_) => emit(const AuthState.unauthenticated(
        successMessage:
            'Password reset email sent. Check your inbox.',
      )),
    );
  }

  void _onClearFeedbackRequested(
    ClearFeedbackRequested event,
    Emitter<AuthState> emit,
  ) {
    if (state.status == AuthStatus.error) {
      emit(const AuthState.unauthenticated());
    } else {
      emit(state.copyWith(
        errorMessage: null,
        successMessage: null,
      ));
    }
  }
}
