import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/widgets/widgets.dart';
import '../../domain/entities/user_entity.dart';
import '../bloc/auth_bloc.dart';
import '../bloc/auth_event.dart';
import '../bloc/auth_state.dart';
import 'registration_page.dart';
import 'verify_email_page.dart';

class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();

  bool _isLoading = false;
  bool _awaitingPasswordReset = false;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  void _onSignIn() {
    // Component Ideation — Added small clarifying comment for sign-in flow and validation.
    if (_formKey.currentState?.validate() ?? false) {
      context.read<AuthBloc>().add(SignInRequested(
            email: _emailController.text.trim(),
            password: _passwordController.text,
          ));
    }
  }

  void _onGoogleSignIn() {
    context.read<AuthBloc>().add(const GoogleSignInRequested(
          role: UserRole.entrepreneur,
        ));
  }

  void _navigateBasedOnRole(UserEntity user) {
    Navigator.of(context).popUntil((route) => route.isFirst);
  }

  @override
  Widget build(BuildContext context) {
    return BlocListener<AuthBloc, AuthState>(
      listener: (context, state) {
        setState(() => _isLoading = state.isLoading);

        if (_awaitingPasswordReset && !state.isLoading) {
          setState(() => _awaitingPasswordReset = false);
          if (Navigator.of(context).canPop()) {
            Navigator.of(context).pop();
          }
          if (state.successMessage != null) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(state.successMessage!),
                backgroundColor: AppColors.success,
              ),
            );
            context.read<AuthBloc>().add(const ClearFeedbackRequested());
          } else if (state.hasError && state.errorMessage != null) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(state.errorMessage!),
                backgroundColor: AppColors.destructive,
              ),
            );
            context.read<AuthBloc>().add(const ClearFeedbackRequested());
          }
          return;
        }

        if (state.hasError && state.errorMessage != null && !_awaitingPasswordReset) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(state.errorMessage!),
              backgroundColor: AppColors.destructive,
            ),
          );
        }

        if (state.needsEmailVerification && state.user != null) {
          Navigator.pushReplacement(
            context,
            MaterialPageRoute(
              builder: (context) => VerifyEmailPage(
                email: state.user!.email ?? '',
              ),
            ),
          );
        }

        if (state.isAuthenticated && state.user != null) {
          _navigateBasedOnRole(state.user!);
        }
      },
      child: Scaffold(
        body: SafeArea(
          child: SingleChildScrollView(
            padding: AppSpacing.screenPadding,
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  AppSpacing.gapXxl,
                  const Center(child: AppLogo(size: 56)),
                  AppSpacing.gapXl,
                  Text(
                    'Sign in',
                    style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                    textAlign: TextAlign.center,
                  ),
                  AppSpacing.gapSm,
                  Text(
                    'Enter your email and password below',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: AppColors.mutedForeground,
                        ),
                    textAlign: TextAlign.center,
                  ),
                  AppSpacing.gapXl,
                  GoogleSignInButton(
                    onPressed: _isLoading ? null : _onGoogleSignIn,
                    isLoading: _isLoading,
                  ),
                  AppSpacing.gapLg,
                  const AppDividerWithText(text: 'Or continue with email'),
                  AppSpacing.gapLg,
                  AppTextField(
                    label: 'Email',
                    hint: 'you@example.com',
                    controller: _emailController,
                    prefixIcon: Icons.email_outlined,
                    keyboardType: TextInputType.emailAddress,
                    textInputAction: TextInputAction.next,
                    enabled: !_isLoading,
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'Email is required';
                      }
                      if (!value.contains('@')) {
                        return 'Enter a valid email';
                      }
                      return null;
                    },
                  ),
                  AppSpacing.gapMd,
                  AppPasswordField(
                    label: 'Password',
                    controller: _passwordController,
                    textInputAction: TextInputAction.done,
                    enabled: !_isLoading,
                    onSubmitted: (_) => _onSignIn(),
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'Password is required';
                      }
                      return null;
                    },
                  ),
                  Align(
                    alignment: Alignment.centerRight,
                    child: TextButton(
                      onPressed: _isLoading
                          ? null
                          : () {
                              _showForgotPasswordDialog();
                            },
                      child: Text(
                        'Forgot Password?',
                        style:
                            Theme.of(context).textTheme.bodyMedium?.copyWith(
                                  color: AppColors.primary,
                                  fontWeight: FontWeight.w500,
                                ),
                      ),
                    ),
                  ),
                  AppSpacing.gapMd,
                  AppButton(
                    text: _isLoading ? 'Signing in...' : 'Sign In',
                    onPressed: _isLoading ? null : _onSignIn,
                    isLoading: _isLoading,
                  ),
                  AppSpacing.gapLg,
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        "Don't have an account? ",
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                              color: AppColors.mutedForeground,
                            ),
                      ),
                      GestureDetector(
                        onTap: _isLoading
                            ? null
                            : () {
                                Navigator.pushReplacement(
                                  context,
                                  MaterialPageRoute(
                                    builder: (context) =>
                                        const RegistrationPage(),
                                  ),
                                );
                              },
                        child: Text(
                          'Sign up',
                          style:
                              Theme.of(context).textTheme.bodyMedium?.copyWith(
                                    color: AppColors.primary,
                                    fontWeight: FontWeight.w600,
                                  ),
                        ),
                      ),
                    ],
                  ),
                  AppSpacing.gapXl,
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  void _showForgotPasswordDialog() {
    final emailController = TextEditingController(text: _emailController.text);

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Reset Password'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text(
              'Enter your email address and we\'ll send you a link to reset your password.',
            ),
            AppSpacing.gapMd,
            TextField(
              controller: emailController,
              decoration: const InputDecoration(
                labelText: 'Email',
                hintText: 'you@example.com',
              ),
              keyboardType: TextInputType.emailAddress,
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              final email = emailController.text.trim();
              if (email.isEmpty) {
                return;
              }
              setState(() => _awaitingPasswordReset = true);
              context.read<AuthBloc>().add(PasswordResetRequested(email: email));
            },
            child: const Text('Send Reset Link'),
          ),
        ],
      ),
    );
  }
}
