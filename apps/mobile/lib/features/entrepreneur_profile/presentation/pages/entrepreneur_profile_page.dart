import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../auth/presentation/bloc/auth_bloc.dart';
import '../../../auth/presentation/bloc/auth_event.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/widgets/widgets.dart';
import '../bloc/entrepreneur_profile_bloc.dart';

class EntrepreneurProfilePage extends StatefulWidget {
  const EntrepreneurProfilePage({super.key});

  @override
  State<EntrepreneurProfilePage> createState() =>
      _EntrepreneurProfilePageState();
}

class _EntrepreneurProfilePageState extends State<EntrepreneurProfilePage> {
  final _formKey = GlobalKey<FormState>();

  final _fullName = TextEditingController();
  final _companyName = TextEditingController();
  final _companyReg = TextEditingController();
  final _sector = TextEditingController();
  final _stage = TextEditingController();

  @override
  void initState() {
    super.initState();
    context
        .read<EntrepreneurProfileBloc>()
        .add(const EntrepreneurProfileChecked());
  }

  @override
  void dispose() {
    _fullName.dispose();
    _companyName.dispose();
    _companyReg.dispose();
    _sector.dispose();
    _stage.dispose();
    super.dispose();
  }

  void _submitCreate() {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    context.read<EntrepreneurProfileBloc>().add(
          EntrepreneurProfileCreateRequested(
            fullName: _fullName.text.trim(),
            companyName: _companyName.text.trim(),
            companyRegistrationNumber: _companyReg.text.trim(),
            businessSector: _sector.text.trim(),
            businessStage: _stage.text.trim(),
          ),
        );
  }

  void _load() {
    context
        .read<EntrepreneurProfileBloc>()
        .add(const EntrepreneurProfileLoaded());
  }

  void _confirmLogout() {
    showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Sign out'),
        content: const Text(
          'You will need to sign in again to access your account.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              Navigator.of(ctx).pop();
              context.read<AuthBloc>().add(const SignOutRequested());
            },
            child: Text(
              'Sign out',
              style: TextStyle(
                color: Theme.of(context).colorScheme.error,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _logoutSection({EdgeInsets? margin}) {
    return Card(
      margin: margin,
      child: ListTile(
        leading: Icon(
          Icons.logout_rounded,
          color: Theme.of(context).colorScheme.error,
        ),
        title: const Text('Sign out'),
        subtitle: Text(
          'Leave this session on this device',
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: AppColors.mutedForeground,
              ),
        ),
        trailing: const Icon(Icons.chevron_right_rounded),
        onTap: _confirmLogout,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Profile',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.w800,
                  ),
            ),
            Text(
              'Company & visibility',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: AppColors.mutedForeground,
                    fontWeight: FontWeight.w500,
                  ),
            ),
          ],
        ),
        actions: [
          IconButton(
            tooltip: 'Sign out',
            onPressed: _confirmLogout,
            icon: Icon(
              Icons.logout_rounded,
              color: Theme.of(context).colorScheme.error,
            ),
          ),
          IconButton(
            tooltip: 'Refresh',
            onPressed: _load,
            icon: const Icon(Icons.refresh_rounded),
          ),
        ],
      ),
      body: SafeArea(
        child: Padding(
          padding: AppSpacing.screenPadding,
          child:
              BlocConsumer<EntrepreneurProfileBloc, EntrepreneurProfileState>(
            listener: (context, state) {
              final profile = state.profile;
              if (state.status == EntrepreneurProfileStatus.loaded &&
                  profile != null) {
                _fullName.text = profile.fullName;
                _companyName.text = profile.companyName;
                _sector.text = profile.businessSector;
                _stage.text = profile.businessStage;
              }
            },
            builder: (context, state) {
              if (state.isLoading) {
                return const Center(child: CircularProgressIndicator());
              }
              if (state.status == EntrepreneurProfileStatus.error) {
                return ListView(
                  padding: const EdgeInsets.only(bottom: 100),
                  children: [
                    Card(
                      child: Padding(
                        padding: AppSpacing.paddingLg,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            Icon(
                              Icons.error_outline_rounded,
                              size: 48,
                              color: Theme.of(context)
                                  .colorScheme
                                  .error
                                  .withValues(alpha: 0.8),
                            ),
                            AppSpacing.gapMd,
                            Text(
                              state.error ?? 'We could not load your profile.',
                              style: Theme.of(context).textTheme.bodyLarge,
                              textAlign: TextAlign.center,
                            ),
                            AppSpacing.gapLg,
                            AppButton(text: 'Try again', onPressed: _load),
                          ],
                        ),
                      ),
                    ),
                    AppSpacing.gapMd,
                    _logoutSection(),
                  ],
                );
              }

              if (state.status == EntrepreneurProfileStatus.missing ||
                  state.status == EntrepreneurProfileStatus.initial) {
                return _buildCreateForm();
              }

              if (state.profile == null) {
                return ListView(
                  padding: const EdgeInsets.only(bottom: 100),
                  children: [
                    Card(
                      child: Padding(
                        padding: AppSpacing.paddingMd,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            Text(
                              'Profile found',
                              style: Theme.of(context).textTheme.titleMedium,
                            ),
                            AppSpacing.gapSm,
                            Text(
                              'Load your saved details to view or edit them.',
                              style: Theme.of(context)
                                  .textTheme
                                  .bodyMedium
                                  ?.copyWith(
                                    color: AppColors.mutedForeground,
                                  ),
                            ),
                            AppSpacing.gapLg,
                            AppButton(
                              text: 'Load profile',
                              onPressed: _load,
                            ),
                          ],
                        ),
                      ),
                    ),
                    AppSpacing.gapMd,
                    _logoutSection(),
                  ],
                );
              }

              return _buildView(state);
            },
          ),
        ),
      ),
    );
  }

  Widget _buildCreateForm() {
    return Form(
      key: _formKey,
      child: ListView(
        padding: const EdgeInsets.only(bottom: 100),
        children: [
          Text(
            'Tell investors about your venture',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: AppColors.mutedForeground,
                ),
          ),
          AppSpacing.gapXs,
          Text(
            'Create your entrepreneur profile',
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.w800,
                ),
          ),
          AppSpacing.gapMd,
          Material(
            color: AppColors.card,
            elevation: 0,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
              side: const BorderSide(color: AppColors.border),
            ),
            child: Padding(
              padding: AppSpacing.paddingMd,
              child: Column(
                children: [
                  AppTextField(
                    label: 'Full Name',
                    controller: _fullName,
                    validator: (v) =>
                        (v == null || v.trim().isEmpty) ? 'Required' : null,
                  ),
                  AppSpacing.gapMd,
                  AppTextField(
                    label: 'Company Name',
                    controller: _companyName,
                    validator: (v) =>
                        (v == null || v.trim().isEmpty) ? 'Required' : null,
                  ),
                  AppSpacing.gapMd,
                  AppTextField(
                    label: 'Company Registration Number',
                    controller: _companyReg,
                    validator: (v) =>
                        (v == null || v.trim().isEmpty) ? 'Required' : null,
                  ),
                  AppSpacing.gapMd,
                  AppTextField(
                    label: 'Business Sector',
                    controller: _sector,
                    validator: (v) =>
                        (v == null || v.trim().isEmpty) ? 'Required' : null,
                  ),
                  AppSpacing.gapMd,
                  AppTextField(
                    label: 'Business Stage',
                    hint: 'idea / mvp / early-revenue / scaling',
                    controller: _stage,
                    validator: (v) =>
                        (v == null || v.trim().isEmpty) ? 'Required' : null,
                  ),
                ],
              ),
            ),
          ),
          AppSpacing.gapLg,
          AppButton(text: 'Create profile', onPressed: _submitCreate),
          AppSpacing.gapXl,
          _logoutSection(),
        ],
      ),
    );
  }

  Widget _buildView(EntrepreneurProfileState state) {
    final profile = state.profile!;
    final theme = Theme.of(context);
    return ListView(
      padding: const EdgeInsets.only(bottom: 100),
      children: [
        Container(
          padding: AppSpacing.paddingMd,
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFF2563EB), Color(0xFF1D4ED8)],
            ),
            borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
          ),
          child: Row(
            children: [
              CircleAvatar(
                radius: 28,
                backgroundColor: Colors.white.withValues(alpha: 0.2),
                child: Text(
                  profile.fullName.isNotEmpty
                      ? profile.fullName[0].toUpperCase()
                      : 'E',
                  style: theme.textTheme.headlineSmall?.copyWith(
                    color: Colors.white,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      profile.fullName.isNotEmpty
                          ? profile.fullName
                          : 'Founder',
                      style: theme.textTheme.titleMedium?.copyWith(
                        color: Colors.white,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      profile.companyName,
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: Colors.white.withValues(alpha: 0.9),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        AppSpacing.gapMd,
        Text(
          'Details',
          style: theme.textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.w800,
          ),
        ),
        AppSpacing.gapMd,
        Material(
          color: AppColors.card,
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
            side: const BorderSide(color: AppColors.border),
          ),
          child: Padding(
            padding: AppSpacing.paddingMd,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _detailRow(
                    theme, Icons.person_outline, 'Full name', profile.fullName),
                const Divider(height: AppSpacing.lg, color: AppColors.border),
                _detailRow(theme, Icons.business_outlined, 'Company',
                    profile.companyName),
                const Divider(height: AppSpacing.lg, color: AppColors.border),
                _detailRow(theme, Icons.category_outlined, 'Sector',
                    profile.businessSector),
                const Divider(height: AppSpacing.lg, color: AppColors.border),
                _detailRow(theme, Icons.timeline_outlined, 'Stage',
                    profile.businessStage),
              ],
            ),
          ),
        ),
        AppSpacing.gapMd,
        Text(
          'Edit profile',
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w800,
              ),
        ),
        AppSpacing.gapXs,
        Text(
          'Update your info and tap Save changes.',
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: AppColors.mutedForeground,
              ),
        ),
        AppSpacing.gapMd,
        Material(
          color: AppColors.card,
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
            side: const BorderSide(color: AppColors.border),
          ),
          child: Padding(
            padding: AppSpacing.paddingMd,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                AppTextField(
                  label: 'Full name',
                  controller: _fullName,
                  prefixIcon: Icons.person_outline,
                ),
                AppSpacing.gapMd,
                AppTextField(
                  label: 'Company name',
                  controller: _companyName,
                  prefixIcon: Icons.business_outlined,
                ),
                AppSpacing.gapMd,
                AppTextField(
                  label: 'Business sector',
                  controller: _sector,
                  prefixIcon: Icons.category_outlined,
                ),
                AppSpacing.gapMd,
                AppTextField(
                  label: 'Business stage',
                  hint: 'idea / mvp / early-revenue / scaling',
                  controller: _stage,
                  prefixIcon: Icons.timeline_outlined,
                ),
              ],
            ),
          ),
        ),
        AppSpacing.gapMd,
        AppButton(
          text: 'Save changes',
          onPressed: () {
            context.read<EntrepreneurProfileBloc>().add(
                  EntrepreneurProfileUpdateRequested({
                    'fullName': _fullName.text.trim().isEmpty
                        ? profile.fullName
                        : _fullName.text.trim(),
                    'companyName': _companyName.text.trim().isEmpty
                        ? profile.companyName
                        : _companyName.text.trim(),
                    'businessStage': _stage.text.trim().isEmpty
                        ? profile.businessStage
                        : _stage.text.trim(),
                  }),
                );
          },
        ),
        AppSpacing.gapXl,
        _logoutSection(),
      ],
    );
  }

  Widget _detailRow(
      ThemeData theme, IconData icon, String label, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 20, color: AppColors.mutedForeground),
        const SizedBox(width: AppSpacing.sm),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: theme.textTheme.labelMedium?.copyWith(
                  color: AppColors.mutedForeground,
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                value.isEmpty ? '—' : value,
                style: theme.textTheme.bodyLarge?.copyWith(
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
