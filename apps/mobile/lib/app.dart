import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import 'core/di/injection_container.dart';
import 'core/theme/app_theme.dart';
import 'features/auth/presentation/bloc/auth_bloc.dart';
import 'features/auth/presentation/bloc/auth_event.dart';
import 'features/auth/presentation/bloc/auth_state.dart';
import 'features/auth/presentation/pages/login_page.dart';
import 'features/auth/presentation/pages/verify_email_page.dart';
import 'features/shell/presentation/pages/admin_shell.dart';
import 'features/shell/presentation/pages/entrepreneur_shell.dart';
import 'features/shell/presentation/pages/investor_shell.dart';
import 'features/user_profile/presentation/bloc/user_profile_bloc.dart';
import 'features/user_profile/presentation/pages/account_gate_page.dart';

class SepmsApp extends StatelessWidget {
  const SepmsApp({super.key});

  @override
  Widget build(BuildContext context) {
    /// Builds the root application and provides top-level Bloc providers.
    /// This widget wires global providers and configures the MaterialApp.
    return MultiBlocProvider(
      providers: [
        BlocProvider<AuthBloc>(
          create: (context) => sl<AuthBloc>()..add(const AuthCheckRequested()),
        ),
        BlocProvider<UserProfileBloc>(
          create: (context) => sl<UserProfileBloc>(),
        ),
      ],
      child: MaterialApp(
        title: 'SEPMS',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.lightTheme,
        darkTheme: AppTheme.darkTheme,
        themeMode: ThemeMode.light,
        home: const AuthWrapper(),
      ),
    );
  }
}

class AuthWrapper extends StatelessWidget {
  const AuthWrapper({super.key});

  @override
  Widget build(BuildContext context) {
    /// Chooses the correct screen based on authentication state.
    /// Maps auth states to appropriate pages (login, verification, dashboard).
    return BlocBuilder<AuthBloc, AuthState>(
      builder: (context, state) {
        switch (state.status) {
          case AuthStatus.initial:
          case AuthStatus.loading:
            return const _SplashScreen();

          case AuthStatus.authenticated:
            return _buildAuthenticatedScreen(state);

          case AuthStatus.emailVerificationRequired:
            return VerifyEmailPage(
              email: state.user?.email ?? '',
            );

          case AuthStatus.unauthenticated:
          case AuthStatus.error:
            return const LoginPage();
        }
      },
    );
  }

  Widget _buildAuthenticatedScreen(AuthState state) {
    final user = state.user;
    if (user == null) {
      return const LoginPage();
    }

    if (!user.isVerified) {
      return AccountGatePage(user: user);
    }

    switch (user.role) {
      case UserRole.entrepreneur:
        return const EntrepreneurShell();
      case UserRole.investor:
        return const InvestorShell();
      case UserRole.admin:
        return const AdminShell();
    }
  }
}

class _SplashScreen extends StatelessWidget {
  const _SplashScreen();

  @override
  Widget build(BuildContext context) {
    /// Simple splash/loading screen shown during authentication checks.
    return Scaffold(
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [
                    Theme.of(context).primaryColor,
                    Theme.of(context).primaryColor.withValues(alpha: 0.8),
                  ],
                ),
                borderRadius: BorderRadius.circular(20),
              ),
              child: const Center(
                child: Text(
                  'S',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 40,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 24),
            const CircularProgressIndicator(),
          ],
        ),
      ),
    );
  }
}
