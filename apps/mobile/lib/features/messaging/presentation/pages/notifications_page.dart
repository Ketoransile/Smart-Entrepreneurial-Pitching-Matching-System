import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/widgets/widgets.dart';
import '../bloc/messaging_bloc.dart';

class NotificationsPage extends StatelessWidget {
  const NotificationsPage({super.key});

  Future<void> _reload(BuildContext context) async {
    context.read<MessagingBloc>().add(const NotificationsRequested());
    await Future<void>.delayed(const Duration(milliseconds: 400));
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final locale = MaterialLocalizations.of(context);

    return BlocBuilder<MessagingBloc, MessagingState>(
      builder: (context, state) {
        if (state.isLoading && state.notifications.isEmpty) {
          return const Center(child: CircularProgressIndicator());
        }
        if (state.status == MessagingStatus.error &&
            state.notifications.isEmpty) {
          return EmptyStateView(
            icon: Icons.notifications_off_outlined,
            title: 'Could not load alerts',
            message: state.error ?? 'Try again in a moment.',
            actionLabel: 'Retry',
            onAction: () => _reload(context),
          );
        }
        if (state.notifications.isEmpty) {
          return EmptyStateView(
            icon: Icons.notifications_none_rounded,
            title: 'You are all caught up',
            message:
                'Meeting updates, invitations, and system notices will land here.',
            actionLabel: 'Refresh',
            onAction: () => _reload(context),
          );
        }

        return RefreshIndicator(
          onRefresh: () => _reload(context),
          child: ListView.separated(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.all(AppSpacing.md),
            itemCount: state.notifications.length,
            separatorBuilder: (_, __) => AppSpacing.gapMd,
            itemBuilder: (context, i) {
              final n = state.notifications[i];
              final createdRaw = n.data['createdAt'];
              String? timeLine;
              if (createdRaw is String) {
                final parsed = DateTime.tryParse(createdRaw);
                if (parsed != null) {
                  timeLine = locale.formatShortDate(parsed.toLocal());
                }
              }

              return Material(
                color: AppColors.card,
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
                  side: BorderSide(
                    color: n.read
                        ? AppColors.border
                        : AppColors.primary.withValues(alpha: 0.35),
                  ),
                ),
                clipBehavior: Clip.antiAlias,
                child: InkWell(
                  onTap: n.id.isEmpty
                      ? null
                      : () => context.read<MessagingBloc>().add(
                            NotificationReadRequested(n.id),
                          ),
                  child: Padding(
                    padding: AppSpacing.paddingMd,
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        DecoratedBox(
                          decoration: BoxDecoration(
                            color: n.read
                                ? AppColors.muted
                                : AppColors.primary.withValues(alpha: 0.1),
                            borderRadius:
                                BorderRadius.circular(AppSpacing.radiusMd),
                          ),
                          child: Padding(
                            padding: const EdgeInsets.all(10),
                            child: Icon(
                              n.read
                                  ? Icons.notifications_none_rounded
                                  : Icons.notifications_active_rounded,
                              color: n.read
                                  ? AppColors.mutedForeground
                                  : AppColors.primary,
                              size: 22,
                            ),
                          ),
                        ),
                        const SizedBox(width: AppSpacing.md),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                n.title,
                                style: theme.textTheme.titleSmall?.copyWith(
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                              if (n.body.isNotEmpty) ...[
                                AppSpacing.gapXs,
                                Text(
                                  n.body,
                                  style: theme.textTheme.bodyMedium?.copyWith(
                                    color: AppColors.foreground
                                        .withValues(alpha: 0.88),
                                    height: 1.4,
                                  ),
                                ),
                              ],
                              if (timeLine != null) ...[
                                AppSpacing.gapSm,
                                Text(
                                  timeLine,
                                  style: theme.textTheme.labelSmall?.copyWith(
                                    color: AppColors.mutedForeground,
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ),
                        if (!n.read)
                          Container(
                            width: 10,
                            height: 10,
                            margin: const EdgeInsets.only(top: 4),
                            decoration: const BoxDecoration(
                              color: AppColors.primary,
                              shape: BoxShape.circle,
                            ),
                          ),
                      ],
                    ),
                  ),
                ),
              );
            },
          ),
        );
      },
    );
  }
}
