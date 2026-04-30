import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../auth/presentation/bloc/auth_bloc.dart';
import '../../../auth/presentation/bloc/auth_event.dart';
import '../../../../core/di/injection_container.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/widgets/app_button.dart';
import '../../../../core/widgets/app_text_field.dart';
import '../../../documents/presentation/bloc/documents_bloc.dart';
import '../../../documents/presentation/pages/documents_page.dart';
import '../../../feedback/presentation/bloc/feedback_bloc.dart';
import '../../../feedback/presentation/pages/feedback_page.dart';
import '../../../invitations/presentation/bloc/invitations_bloc.dart';
import '../../../invitations/presentation/pages/invitations_page.dart';
import '../../../meetings/presentation/bloc/meetings_bloc.dart';
import '../../../meetings/presentation/pages/meetings_page.dart';
import '../../../milestones/presentation/bloc/milestones_bloc.dart';
import '../../../milestones/presentation/pages/milestones_page.dart';
import '../bloc/investor_profile_bloc.dart';

class InvestorProfilePage extends StatefulWidget {
  const InvestorProfilePage({super.key});

  @override
  State<InvestorProfilePage> createState() => _InvestorProfilePageState();
}

class _InvestorProfilePageState extends State<InvestorProfilePage> {
  final _formKey = GlobalKey<FormState>();
  final _fullName = TextEditingController();
  final _sectors = TextEditingController();
  final _stages = TextEditingController();
  final _min = TextEditingController();
  final _max = TextEditingController();
  final _types = TextEditingController();

  @override
  void initState() {
    super.initState();
    context.read<InvestorProfileBloc>().add(const InvestorProfileRequested());
  }

  @override
  void dispose() {
    _fullName.dispose();
    _sectors.dispose();
    _stages.dispose();
    _min.dispose();
    _max.dispose();
    _types.dispose();
    super.dispose();
  }

  Map<String, dynamic> _payload() {
    final sectors = _sectors.text
        .split(',')
        .map((e) => e.trim())
        .where((e) => e.isNotEmpty)
        .toList();
    final stages = _stages.text
        .split(',')
        .map((e) => e.trim())
        .where((e) => e.isNotEmpty)
        .toList();
    final types = _types.text
        .split(',')
        .map((e) => e.trim())
        .where((e) => e.isNotEmpty)
        .toList();

    final min = int.tryParse(_min.text.trim());
    final max = int.tryParse(_max.text.trim());

    return {
      'fullName': _fullName.text.trim(),
      'preferredSectors': sectors,
      'preferredStages': stages,
      'investmentRange': {'min': min ?? 0, 'max': max ?? 0},
      'investmentType': types,
    };
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

  Widget _logoutSection() {
    return Card(
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
        title: const Text('Profile'),
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
            icon: const Icon(Icons.refresh_rounded),
            onPressed: () => context
                .read<InvestorProfileBloc>()
                .add(const InvestorProfileRequested()),
          ),
        ],
      ),
      body: SafeArea(
        child: Padding(
          padding: AppSpacing.screenPadding,
          child: BlocConsumer<InvestorProfileBloc, InvestorProfileState>(
            listener: (context, state) {
              final p = state.profile;
              if (state.status == InvestorProfileStatus.loaded && p != null) {
                _fullName.text = p.fullName;
                _sectors.text = p.preferredSectors.join(', ');
                _stages.text = p.preferredStages.join(', ');
              }
            },
            builder: (context, state) {
              if (state.isLoading) {
                return const Center(child: CircularProgressIndicator());
              }
              if (state.status == InvestorProfileStatus.error) {
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
                                  .withValues(alpha: 0.85),
                            ),
                            AppSpacing.gapMd,
                            Text(
                              state.error ??
                                  'We could not load your investor profile.',
                              style: Theme.of(context).textTheme.bodyLarge,
                              textAlign: TextAlign.center,
                            ),
                            AppSpacing.gapLg,
                            AppButton(
                              text: 'Create profile',
                              onPressed: () {
                                context.read<InvestorProfileBloc>().add(
                                      InvestorProfileCreateRequested(
                                          _payload()),
                                    );
                              },
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

              return Form(
                key: _formKey,
                child: ListView(
                  padding: const EdgeInsets.only(bottom: 100),
                  children: [
                    Text(
                      'Investor workspace',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: AppColors.mutedForeground,
                          ),
                    ),
                    AppSpacing.gapXs,
                    Text(
                      'Tune how you discover and evaluate founders',
                      style:
                          Theme.of(context).textTheme.headlineSmall?.copyWith(
                                fontWeight: FontWeight.w700,
                              ),
                    ),
                    AppSpacing.gapMd,
                    Builder(
                      builder: (context) {
                        final name = (_fullName.text.isNotEmpty
                                ? _fullName.text
                                : null) ??
                            state.profile?.fullName;
                        if ((name ?? '').trim().isEmpty) {
                          return const SizedBox.shrink();
                        }
                        final displayName = name!.trim();
                        return Padding(
                          padding: const EdgeInsets.only(bottom: AppSpacing.md),
                          child: Container(
                            padding: AppSpacing.paddingMd,
                            decoration: BoxDecoration(
                              gradient: const LinearGradient(
                                colors: [Color(0xFF2563EB), Color(0xFF1D4ED8)],
                              ),
                              borderRadius:
                                  BorderRadius.circular(AppSpacing.radiusLg),
                            ),
                            child: Row(
                              children: [
                                CircleAvatar(
                                  radius: 26,
                                  backgroundColor:
                                      Colors.white.withValues(alpha: 0.2),
                                  child: Text(
                                    displayName[0].toUpperCase(),
                                    style: Theme.of(context)
                                        .textTheme
                                        .titleLarge
                                        ?.copyWith(
                                          color: Colors.white,
                                          fontWeight: FontWeight.w700,
                                        ),
                                  ),
                                ),
                                const SizedBox(width: AppSpacing.md),
                                Expanded(
                                  child: Text(
                                    displayName,
                                    style: Theme.of(context)
                                        .textTheme
                                        .titleMedium
                                        ?.copyWith(
                                          color: Colors.white,
                                          fontWeight: FontWeight.w700,
                                        ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
                    Card(
                      child: Padding(
                        padding: AppSpacing.paddingMd,
                        child: Column(
                          children: [
                            AppTextField(
                              label: 'Full name',
                              controller: _fullName,
                              validator: (v) => (v == null || v.trim().isEmpty)
                                  ? 'Required'
                                  : null,
                            ),
                            AppSpacing.gapMd,
                            AppTextField(
                              label: 'Preferred sectors (comma separated)',
                              controller: _sectors,
                            ),
                            AppSpacing.gapMd,
                            AppTextField(
                              label: 'Preferred stages (comma separated)',
                              hint: 'idea, mvp, early-revenue, scaling',
                              controller: _stages,
                            ),
                            AppSpacing.gapMd,
                            Row(
                              children: [
                                Expanded(
                                  child: AppTextField(
                                    label: 'Min',
                                    controller: _min,
                                    keyboardType: TextInputType.number,
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: AppTextField(
                                    label: 'Max',
                                    controller: _max,
                                    keyboardType: TextInputType.number,
                                  ),
                                ),
                              ],
                            ),
                            AppSpacing.gapMd,
                            AppTextField(
                              label: 'Investment types (comma separated)',
                              controller: _types,
                            ),
                          ],
                        ),
                      ),
                    ),
                    AppSpacing.gapLg,
                    AppButton(
                      text: 'Save',
                      onPressed: () {
                        if (!(_formKey.currentState?.validate() ?? false)) {
                          return;
                        }
                        final payload = _payload();
                        if (state.profile == null) {
                          context
                              .read<InvestorProfileBloc>()
                              .add(InvestorProfileCreateRequested(payload));
                        } else {
                          context
                              .read<InvestorProfileBloc>()
                              .add(InvestorProfileUpdateRequested(payload));
                        }
                      },
                    ),
                    AppSpacing.gapXl,
                    Text(
                      'Quick tools',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.w800,
                          ),
                    ),
                    AppSpacing.gapSm,
                    Text(
                      'Shortcuts to your investor workflow',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: AppColors.mutedForeground,
                          ),
                    ),
                    AppSpacing.gapMd,
                    GridView.count(
                      crossAxisCount: 2,
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      mainAxisSpacing: AppSpacing.md,
                      crossAxisSpacing: AppSpacing.md,
                      childAspectRatio: 1.22,
                      children: [
                        _InvestorQuickTool(
                          icon: Icons.mail_outline_rounded,
                          title: 'Invitations',
                          subtitle: 'Requests & replies',
                          onTap: () => Navigator.push(
                            context,
                            MaterialPageRoute<void>(
                              builder: (_) => BlocProvider<InvitationsBloc>(
                                create: (_) => sl<InvitationsBloc>(),
                                child: const InvitationsPage(),
                              ),
                            ),
                          ),
                        ),
                        _InvestorQuickTool(
                          icon: Icons.calendar_month_rounded,
                          title: 'Meetings',
                          subtitle: 'Schedule & notes',
                          onTap: () => Navigator.push(
                            context,
                            MaterialPageRoute<void>(
                              builder: (_) => BlocProvider<MeetingsBloc>(
                                create: (_) => sl<MeetingsBloc>(),
                                child: const MeetingsPage(),
                              ),
                            ),
                          ),
                        ),
                        _InvestorQuickTool(
                          icon: Icons.flag_rounded,
                          title: 'Milestones',
                          subtitle: 'Track progress',
                          onTap: () => Navigator.push(
                            context,
                            MaterialPageRoute<void>(
                              builder: (_) => BlocProvider<MilestonesBloc>(
                                create: (_) => sl<MilestonesBloc>(),
                                child: const MilestonesPage(),
                              ),
                            ),
                          ),
                        ),
                        _InvestorQuickTool(
                          icon: Icons.star_rounded,
                          title: 'Feedback',
                          subtitle: 'Given & received',
                          onTap: () => Navigator.push(
                            context,
                            MaterialPageRoute<void>(
                              builder: (_) => BlocProvider<FeedbackBloc>(
                                create: (_) => sl<FeedbackBloc>(),
                                child: const FeedbackPage(),
                              ),
                            ),
                          ),
                        ),
                        _InvestorQuickTool(
                          icon: Icons.folder_open_rounded,
                          title: 'Documents',
                          subtitle: 'Decks & files',
                          onTap: () => Navigator.push(
                            context,
                            MaterialPageRoute<void>(
                              builder: (_) => BlocProvider<DocumentsBloc>(
                                create: (_) => sl<DocumentsBloc>(),
                                child: const DocumentsPage(),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                    AppSpacing.gapXl,
                    Text(
                      'Account',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.w800,
                          ),
                    ),
                    AppSpacing.gapSm,
                    _logoutSection(),
                  ],
                ),
              );
            },
          ),
        ),
      ),
    );
  }
}

class _InvestorQuickTool extends StatelessWidget {
  const _InvestorQuickTool({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Material(
      color: AppColors.card,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
        side: const BorderSide(color: AppColors.border),
      ),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: AppSpacing.paddingMd,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              DecoratedBox(
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(10),
                  child: Icon(icon, color: AppColors.primary, size: 22),
                ),
              ),
              const Spacer(),
              Text(
                title,
                style: theme.textTheme.titleSmall?.copyWith(
                  fontWeight: FontWeight.w800,
                ),
              ),
              AppSpacing.gapXs,
              Text(
                subtitle,
                style: theme.textTheme.bodySmall?.copyWith(
                  color: AppColors.mutedForeground,
                  height: 1.25,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
