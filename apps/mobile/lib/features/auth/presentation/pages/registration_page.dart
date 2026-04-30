import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/widgets/widgets.dart';
import '../../domain/entities/user_entity.dart';
import '../bloc/auth_bloc.dart';
import '../bloc/auth_event.dart';
import '../bloc/auth_state.dart';
class RegistrationPage extends StatefulWidget {
  const RegistrationPage({super.key});

  @override
  State<RegistrationPage> createState() => _RegistrationPageState();
}

class _RegistrationPageState extends State<RegistrationPage> {
  final _formKey = GlobalKey<FormState>();
  final _fullNameController = TextEditingController();
  final _companyController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  UserRole _selectedRole = UserRole.entrepreneur;
  bool _isLoading = false;

  @override
  void dispose() {
    _fullNameController.dispose();
    _companyController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  void _onRoleChanged(UserRole role) {
    setState(() {
      _selectedRole = role;
      _companyController.clear();
    });
  }

  String? _validatePassword(String? value) {
    if (value == null || value.isEmpty) {
      return 'Password is required';
    }
    if (value.length < 6) {
      return 'Password must be at least 6 characters';
    }
    return null;
  }

  String? _validateConfirmPassword(String? value) {
    if (value != _passwordController.text) {
      return 'Passwords do not match';
    }
    return null;
  }

  void _onSignUp() {
    // Maps the org field to company/fund name based on the selected role.
    if (_formKey.currentState?.validate() ?? false) {
      context.read<AuthBloc>().add(SignUpRequested(
            email: _emailController.text.trim(),
            password: _passwordController.text,
            fullName: _fullNameController.text.trim(),
            role: _selectedRole,
            companyName: _selectedRole == UserRole.entrepreneur
                ? _companyController.text.trim()
                : null,
            fundName: _selectedRole == UserRole.investor
                ? _companyController.text.trim()
                : null,
          ));
    }
  }

  void _onGoogleSignUp() {
    context.read<AuthBloc>().add(GoogleSignInRequested(
          role: _selectedRole,
          companyName: _selectedRole == UserRole.entrepreneur
              ? _companyController.text.trim()
              : null,
          fundName: _selectedRole == UserRole.investor
              ? _companyController.text.trim()
              : null,
        ));
  }

  @override
  Widget build(BuildContext context) {
    return BlocListener<AuthBloc, AuthState>(
      listener: (context, state) {
        setState(() => _isLoading = state.isLoading);

        if (state.hasError && state.errorMessage != null) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(state.errorMessage!),
              backgroundColor: AppColors.destructive,
            ),
          );
        }

        if (state.needsEmailVerification) {
          // Dismiss registration so [AuthWrapper] (root) can show verify / login.
          Navigator.of(context).popUntil((route) => route.isFirst);
        }

        if (state.isAuthenticated) {
          Navigator.of(context).popUntil((route) => route.isFirst);
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
                  AppSpacing.gapLg,
                  const Center(child: AppLogo(size: 56)),
                  AppSpacing.gapXl,
                  Text(
                    'Create an account',
                    style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                    textAlign: TextAlign.center,
                  ),
                  AppSpacing.gapSm,
                  Text(
                    'Select your role and enter your details',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: AppColors.mutedForeground,
                        ),
                    textAlign: TextAlign.center,
                  ),
                  AppSpacing.gapLg,
                  Card(
                    child: Padding(
                      padding: AppSpacing.paddingMd,
                      child: Column(
                        children: [
                          RoleSelector(
                            selectedRole: _selectedRole,
                            onRoleChanged: _onRoleChanged,
                            enabled: !_isLoading,
                          ),
                          AppSpacing.gapLg,
                          GoogleSignInButton(
                            onPressed: _isLoading ? null : _onGoogleSignUp,
                            isLoading: _isLoading,
                          ),
                          AppSpacing.gapLg,
                          const AppDividerWithText(
                              text: 'Or continue with email'),
                          AppSpacing.gapLg,
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Expanded(
                                child: AppTextField(
                                  label: 'Full Name',
                                  hint: 'Abebe Kebede',
                                  controller: _fullNameController,
                                  prefixIcon: Icons.person_outline,
                                  textCapitalization: TextCapitalization.words,
                                  enabled: !_isLoading,
                                  validator: (value) {
                                    if (value == null || value.isEmpty) {
                                      return 'Name is required';
                                    }
                                    return null;
                                  },
                                ),
                              ),
                              AppSpacing.hGapMd,
                              Expanded(
                                child: AppTextField(
                                  label: _selectedRole == UserRole.entrepreneur
                                      ? 'Company'
                                      : 'Org / Fund',
                                  hint: _selectedRole == UserRole.entrepreneur
                                      ? 'Ethio Tech PLC'
                                      : 'Addis Capital Group',
                                  controller: _companyController,
                                  prefixIcon: Icons.business_outlined,
                                  textCapitalization: TextCapitalization.words,
                                  enabled: !_isLoading,
                                ),
                              ),
                            ],
                          ),
                          AppSpacing.gapMd,
                          AppTextField(
                            label: 'Email',
                            hint: 'you@example.com',
                            controller: _emailController,
                            prefixIcon: Icons.email_outlined,
                            keyboardType: TextInputType.emailAddress,
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
                            enabled: !_isLoading,
                            validator: _validatePassword,
                          ),
                          AppSpacing.gapMd,
                          AppPasswordField(
                            label: 'Confirm password',
                            controller: _confirmPasswordController,
                            enabled: !_isLoading,
                            validator: _validateConfirmPassword,
                          ),
                          AppSpacing.gapLg,
                          AppButton(
                            text: _isLoading
                                ? 'Creating account...'
                                : 'Create Account',
                            onPressed: _isLoading ? null : _onSignUp,
                            isLoading: _isLoading,
                          ),
                        ],
                      ),
                    ),
                  ),
                  AppSpacing.gapLg,
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        'Already have an account? ',
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                              color: AppColors.mutedForeground,
                            ),
                      ),
                      GestureDetector(
                        onTap: _isLoading
                            ? null
                            : () => Navigator.of(context).pop(),
                        child: Text(
                          'Sign in',
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
}
