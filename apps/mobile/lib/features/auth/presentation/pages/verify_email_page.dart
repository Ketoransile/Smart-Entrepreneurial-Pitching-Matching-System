import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/widgets/widgets.dart';
import '../bloc/auth_bloc.dart';
import '../bloc/auth_event.dart';
import '../bloc/auth_state.dart';
import 'login_page.dart';

class VerifyEmailPage extends StatefulWidget {
  final String email;

  const VerifyEmailPage({
    super.key,
    required this.email,
  });

  @override
  State<VerifyEmailPage> createState() => _VerifyEmailPageState();
}

class _VerifyEmailPageState extends State<VerifyEmailPage> {
  bool _isResending = false;
  bool _isChecking = false;
  bool _resendSuccess = false;

  void _onResendVerification() {
    setState(() {
      _isResending = true;
      _resendSuccess = false;
    });

    context.read<AuthBloc>().add(const ResendVerificationRequested());
  }

  void _onCheckVerification() {
    setState(() => _isChecking = true);
    context.read<AuthBloc>().add(const RefreshUserRequested());
  }

  @override
  Widget build(BuildContext context) {
    return BlocListener<AuthBloc, AuthState>(
      listener: (context, state) {
        if (_isResending && !state.isLoading) {
          setState(() {
            _isResending = false;
            _resendSuccess = state.errorMessage == null;
          });

          if (_resendSuccess) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Verification email sent!'),
                backgroundColor: AppColors.success,
              ),
            );
          } else if (state.errorMessage != null) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(state.errorMessage!),
                backgroundColor: AppColors.destructive,
              ),
            );
          }
        }

        if (_isChecking && !state.isLoading) {
          setState(() => _isChecking = false);

          if (state.errorMessage != null) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(state.errorMessage!),
                backgroundColor: AppColors.destructive,
              ),
            );
          } else if (state.isAuthenticated) {
            Navigator.of(context).popUntil((route) => route.isFirst);
          } else if (state.needsEmailVerification) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Email not verified yet. Please check your inbox.'),
                backgroundColor: AppColors.warning,
              ),
            );
          }
        }
      },
      child: Scaffold(
        body: SafeArea(
          child: Padding(
            padding: AppSpacing.screenPadding,
            child: Column(
              children: [
                const Spacer(),
                const Center(child: AppLogo(size: 56)),
                AppSpacing.gapXl,
                Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: 0.1),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.email_outlined,
                    size: 40,
                    color: AppColors.primary,
                  ),
                ),
                AppSpacing.gapXl,
                Text(
                  'Check your email',
                  style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                  textAlign: TextAlign.center,
                ),
                AppSpacing.gapMd,
                Text(
                  "We've sent a verification link to:",
                  style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                        color: AppColors.mutedForeground,
                      ),
                  textAlign: TextAlign.center,
                ),
                AppSpacing.gapSm,
                Text(
                  widget.email,
                  style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                  textAlign: TextAlign.center,
                ),
                AppSpacing.gapMd,
                Text(
                  'Click the link in the email to verify your account and get started.',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: AppColors.mutedForeground,
                      ),
                  textAlign: TextAlign.center,
                ),
                AppSpacing.gapXxl,
                AppButton(
                  text: _isResending
                      ? 'Sending...'
                      : 'Resend verification email',
                  onPressed: _isResending ? null : _onResendVerification,
                  variant: AppButtonVariant.outline,
                  isLoading: _isResending,
                ),
                AppSpacing.gapMd,
                AppButton(
                  text: _isChecking ? 'Checking...' : "I've verified my email",
                  onPressed: _isChecking ? null : _onCheckVerification,
                  isLoading: _isChecking,
                ),
                AppSpacing.gapLg,
                TextButton(
                  onPressed: () {
                    context.read<AuthBloc>().add(const SignOutRequested());
                    Navigator.pushReplacement(
                      context,
                      MaterialPageRoute(
                        builder: (context) => const LoginPage(),
                      ),
                    );
                  },
                  child: Text(
                    'Back to sign in',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: AppColors.mutedForeground,
                        ),
                  ),
                ),
                const Spacer(),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
