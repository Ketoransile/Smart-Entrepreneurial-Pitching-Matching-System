import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../auth/domain/entities/user_entity.dart';
import '../../../auth/presentation/bloc/auth_bloc.dart';
import '../../../auth/presentation/bloc/auth_event.dart';
import '../../../auth/presentation/bloc/auth_state.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/widgets/app_button.dart';
import '../bloc/user_profile_bloc.dart';
import '../bloc/user_profile_event.dart';
import '../bloc/user_profile_state.dart';

class AccountGatePage extends StatelessWidget {
  final UserEntity user;

  const AccountGatePage({super.key, required this.user});

  @override
  Widget build(BuildContext context) {
    return BlocListener<AuthBloc, AuthState>(
      listener: (context, state) {
        if (state.status == AuthStatus.unauthenticated) {
          // AuthWrapper will redirect to login; nothing to do here.
        }
      },
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Account status'),
          actions: [
            IconButton(
              icon: const Icon(Icons.logout),
              onPressed: () {
                context.read<AuthBloc>().add(const SignOutRequested());
              },
            ),
          ],
        ),
        body: SafeArea(
          child: Padding(
            padding: AppSpacing.screenPadding,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  'Welcome, ${user.displayName ?? 'User'}',
                  style: Theme.of(context).textTheme.headlineSmall,
                ),
                AppSpacing.gapSm,
                Text('Role: ${user.role.name}'),
                Text('Status: ${user.status.name}'),
                if (user.kycRejectionReason != null)
                  Padding(
                    padding: const EdgeInsets.only(top: 8),
                    child: Text(
                      'Reason: ${user.kycRejectionReason}',
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                  ),
                AppSpacing.gapLg,
                BlocBuilder<UserProfileBloc, UserProfileState>(
                  builder: (context, state) {
                    if (state.status == UserProfileStatus.initial) {
                      return AppButton(
                        text: 'Load my profile',
                        onPressed: () {
                          context
                              .read<UserProfileBloc>()
                              .add(const UserProfileRequested());
                        },
                      );
                    }
                    if (state.isLoading) {
                      return const Center(child: CircularProgressIndicator());
                    }
                    if (state.status == UserProfileStatus.error) {
                      return Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          Text(
                            state.errorMessage ?? 'Could not load profile',
                            style: TextStyle(
                              color: Theme.of(context).colorScheme.error,
                            ),
                          ),
                          AppSpacing.gapMd,
                          AppButton(
                            text: 'Retry',
                            onPressed: () {
                              context
                                  .read<UserProfileBloc>()
                                  .add(const UserProfileRequested());
                            },
                          ),
                        ],
                      );
                    }
                    final profile = state.profile;
                    return Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Text(
                          profile?.hasRoleProfile == true
                              ? 'Profile found.'
                              : 'Profile not complete yet.',
                        ),
                        AppSpacing.gapMd,
                        AppButton(
                          text: 'Refresh profile',
                          onPressed: () {
                            context
                                .read<UserProfileBloc>()
                                .add(const UserProfileRequested());
                          },
                        ),
                      ],
                    );
                  },
                ),
                const Spacer(),
                if (user.status != UserStatus.verified)
                  const Text(
                    'Some features may be restricted until your account is verified.',
                    textAlign: TextAlign.center,
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

