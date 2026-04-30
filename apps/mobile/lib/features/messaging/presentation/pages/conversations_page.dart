import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/widgets/widgets.dart';
import '../bloc/messaging_bloc.dart';
import 'chat_page.dart';

class ConversationsPage extends StatelessWidget {
  const ConversationsPage({super.key});

  Future<void> _reload(BuildContext context) async {
    context.read<MessagingBloc>().add(const ConversationsRequested());
    await Future<void>.delayed(const Duration(milliseconds: 400));
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return BlocBuilder<MessagingBloc, MessagingState>(
      builder: (context, state) {
        if (state.isLoading && state.conversations.isEmpty) {
          return const Center(child: CircularProgressIndicator());
        }
        if (state.status == MessagingStatus.error &&
            state.conversations.isEmpty) {
          return EmptyStateView(
            icon: Icons.chat_bubble_outline_rounded,
            title: 'Could not load chats',
            message: state.error ?? 'Pull to refresh or try again shortly.',
            actionLabel: 'Retry',
            onAction: () => _reload(context),
          );
        }
        if (state.conversations.isEmpty) {
          return EmptyStateView(
            icon: Icons.forum_outlined,
            title: 'No conversations yet',
            message:
                'When you message investors or founders, threads will show up here.',
            actionLabel: 'Refresh',
            onAction: () => _reload(context),
          );
        }

        return RefreshIndicator(
          onRefresh: () => _reload(context),
          child: ListView.separated(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.all(AppSpacing.md),
            itemCount: state.conversations.length,
            separatorBuilder: (_, __) => AppSpacing.gapMd,
            itemBuilder: (context, i) {
              final c = state.conversations[i];
              final title =
                  c.otherUserName.isEmpty ? 'Conversation' : c.otherUserName;
              final initial =
                  title.isNotEmpty ? title.trim()[0].toUpperCase() : '?';

              return Material(
                color: AppColors.card,
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
                  side: const BorderSide(color: AppColors.border),
                ),
                clipBehavior: Clip.antiAlias,
                child: InkWell(
                  onTap: c.id.isEmpty
                      ? null
                      : () {
                          Navigator.push<void>(
                            context,
                            MaterialPageRoute<void>(
                              builder: (_) => BlocProvider.value(
                                value: context.read<MessagingBloc>(),
                                child: ChatPage(conversationId: c.id),
                              ),
                            ),
                          );
                        },
                  child: Padding(
                    padding: AppSpacing.paddingMd,
                    child: Row(
                      children: [
                        CircleAvatar(
                          radius: 24,
                          backgroundColor:
                              AppColors.primary.withValues(alpha: 0.12),
                          child: Text(
                            initial,
                            style: theme.textTheme.titleMedium?.copyWith(
                              color: AppColors.primary,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ),
                        const SizedBox(width: AppSpacing.md),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                title,
                                style: theme.textTheme.titleSmall?.copyWith(
                                  fontWeight: FontWeight.w700,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                              AppSpacing.gapXs,
                              Text(
                                'Tap to open',
                                style: theme.textTheme.bodySmall?.copyWith(
                                  color: AppColors.mutedForeground,
                                ),
                              ),
                            ],
                          ),
                        ),
                        if (c.unreadCount > 0)
                          DecoratedBox(
                            decoration: BoxDecoration(
                              color: theme.colorScheme.primary
                                  .withValues(alpha: 0.14),
                              borderRadius:
                                  BorderRadius.circular(AppSpacing.radiusFull),
                            ),
                            child: Padding(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 10,
                                vertical: 4,
                              ),
                              child: Text(
                                '${c.unreadCount}',
                                style: theme.textTheme.labelMedium?.copyWith(
                                  fontWeight: FontWeight.w800,
                                  color: theme.colorScheme.primary,
                                ),
                              ),
                            ),
                          )
                        else
                          Icon(
                            Icons.done_all_rounded,
                            size: 22,
                            color: AppColors.mutedForeground
                                .withValues(alpha: 0.65),
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
