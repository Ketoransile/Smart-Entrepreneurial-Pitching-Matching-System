import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/di/injection_container.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../documents/presentation/bloc/documents_bloc.dart';
import '../../../documents/presentation/pages/documents_page.dart';
import '../../../invitations/presentation/bloc/invitations_bloc.dart';
import '../../../invitations/presentation/pages/invitations_page.dart';
import '../../../meetings/presentation/bloc/meetings_bloc.dart';
import '../../../meetings/presentation/pages/meetings_page.dart';
import '../../../milestones/presentation/bloc/milestones_bloc.dart';
import '../../../milestones/presentation/pages/milestones_page.dart';
import '../../../feedback/presentation/bloc/feedback_bloc.dart';
import '../../../feedback/presentation/pages/feedback_page.dart';

class EntrepreneurHomePage extends StatelessWidget {
  const EntrepreneurHomePage({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Home',
              style: theme.textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.w800,
              ),
            ),
            Text(
              'Your founder workspace',
              style: theme.textTheme.bodySmall?.copyWith(
                color: AppColors.mutedForeground,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
      body: ListView(
        padding: AppSpacing.screenPadding.copyWith(bottom: 100),
        children: [
          Text(
            'Welcome back',
            style: theme.textTheme.bodyMedium?.copyWith(
              color: AppColors.mutedForeground,
              fontWeight: FontWeight.w600,
            ),
          ),
          AppSpacing.gapXs,
          Text(
            'Build, share, and collaborate',
            style: theme.textTheme.headlineSmall?.copyWith(
              fontWeight: FontWeight.w800,
              height: 1.2,
            ),
          ),
          AppSpacing.gapMd,
          DecoratedBox(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
              gradient: const LinearGradient(
                colors: [Color(0xFF2563EB), Color(0xFF1D4ED8)],
              ),
            ),
            child: Padding(
              padding: AppSpacing.paddingMd,
              child: Row(
                children: [
                  DecoratedBox(
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
                    ),
                    child: const Padding(
                      padding: EdgeInsets.all(10),
                      child: Icon(
                        Icons.lightbulb_outline_rounded,
                        color: Colors.white,
                        size: 26,
                      ),
                    ),
                  ),
                  const SizedBox(width: AppSpacing.md),
                  Expanded(
                    child: Text(
                      'Manage documents, milestones, meetings, and investor conversations in one place.',
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: Colors.white,
                        height: 1.45,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          AppSpacing.gapLg,
          Text(
            'Quick access',
            style: theme.textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w800,
            ),
          ),
          AppSpacing.gapSm,
          Text(
            'Jump into the tools you use most',
            style: theme.textTheme.bodySmall?.copyWith(
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
              _EntrepreneurHubTile(
                icon: Icons.folder_open_rounded,
                title: 'Documents',
                subtitle: 'Decks & files',
                onTap: () => Navigator.push<void>(
                  context,
                  MaterialPageRoute<void>(
                    builder: (_) => BlocProvider<DocumentsBloc>(
                      create: (_) => sl<DocumentsBloc>(),
                      child: const DocumentsPage(),
                    ),
                  ),
                ),
              ),
              _EntrepreneurHubTile(
                icon: Icons.mail_outline_rounded,
                title: 'Invitations',
                subtitle: 'Inbox & replies',
                onTap: () => Navigator.push<void>(
                  context,
                  MaterialPageRoute<void>(
                    builder: (_) => BlocProvider<InvitationsBloc>(
                      create: (_) => sl<InvitationsBloc>(),
                      child: const InvitationsPage(),
                    ),
                  ),
                ),
              ),
              _EntrepreneurHubTile(
                icon: Icons.calendar_month_rounded,
                title: 'Meetings',
                subtitle: 'Schedule & notes',
                onTap: () => Navigator.push<void>(
                  context,
                  MaterialPageRoute<void>(
                    builder: (_) => BlocProvider<MeetingsBloc>(
                      create: (_) => sl<MeetingsBloc>(),
                      child: const MeetingsPage(),
                    ),
                  ),
                ),
              ),
              _EntrepreneurHubTile(
                icon: Icons.flag_rounded,
                title: 'Milestones',
                subtitle: 'Track progress',
                onTap: () => Navigator.push<void>(
                  context,
                  MaterialPageRoute<void>(
                    builder: (_) => BlocProvider<MilestonesBloc>(
                      create: (_) => sl<MilestonesBloc>(),
                      child: const MilestonesPage(),
                    ),
                  ),
                ),
              ),
              _EntrepreneurHubTile(
                icon: Icons.star_rounded,
                title: 'Feedback',
                subtitle: 'Grow with reviews',
                onTap: () => Navigator.push<void>(
                  context,
                  MaterialPageRoute<void>(
                    builder: (_) => BlocProvider<FeedbackBloc>(
                      create: (_) => sl<FeedbackBloc>(),
                      child: const FeedbackPage(),
                    ),
                  ),
                ),
              ),
            ],
          ),
          AppSpacing.gapXl,
          Text(
            'More collaboration tools are on the way.',
            textAlign: TextAlign.center,
            style: theme.textTheme.bodySmall?.copyWith(
              color: AppColors.mutedForeground,
            ),
          ),
        ],
      ),
    );
  }
}

class _EntrepreneurHubTile extends StatelessWidget {
  const _EntrepreneurHubTile({
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
