import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../bloc/messaging_bloc.dart';
import 'notifications_page.dart';
import 'conversations_page.dart';

class MessageCenterPage extends StatefulWidget {
  const MessageCenterPage({super.key});

  @override
  State<MessageCenterPage> createState() => _MessageCenterPageState();
}

class _MessageCenterPageState extends State<MessageCenterPage>
    with SingleTickerProviderStateMixin {
  late final TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _tabController.addListener(_onTabChanged);
    context.read<MessagingBloc>().add(const UnreadCountRequested());
    context.read<MessagingBloc>().add(const ConversationsRequested());
  }

  void _onTabChanged() {
    if (_tabController.indexIsChanging) return;
    if (_tabController.index == 0) {
      context.read<MessagingBloc>().add(const ConversationsRequested());
    } else {
      context.read<MessagingBloc>().add(const NotificationsRequested());
    }
  }

  @override
  void dispose() {
    _tabController.removeListener(_onTabChanged);
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Messages'),
        bottom: TabBar(
          controller: _tabController,
          indicatorSize: TabBarIndicatorSize.label,
          indicatorWeight: 3,
          labelStyle: Theme.of(context).textTheme.labelLarge?.copyWith(
                fontWeight: FontWeight.w700,
              ),
          unselectedLabelColor: AppColors.mutedForeground,
          tabs: const [
            Tab(text: 'Chats'),
            Tab(text: 'Notifications'),
          ],
        ),
        actions: [
          IconButton(
            tooltip: 'Refresh',
            icon: const Icon(Icons.refresh_rounded),
            onPressed: () {
              context.read<MessagingBloc>().add(const UnreadCountRequested());
              context.read<MessagingBloc>().add(const ConversationsRequested());
              context.read<MessagingBloc>().add(const NotificationsRequested());
            },
          ),
          BlocBuilder<MessagingBloc, MessagingState>(
            builder: (context, state) => Padding(
              padding: const EdgeInsets.only(right: AppSpacing.md, left: 4),
              child: DecoratedBox(
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.primary.withValues(
                        alpha: 0.12,
                      ),
                  borderRadius: BorderRadius.circular(AppSpacing.radiusFull),
                ),
                child: Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.md,
                    vertical: AppSpacing.xs + 2,
                  ),
                  child: Text(
                    '${state.unreadCount} unread',
                    style: Theme.of(context).textTheme.labelMedium?.copyWith(
                          fontWeight: FontWeight.w700,
                          color: Theme.of(context).colorScheme.primary,
                        ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
      body: TabBarView(
        controller: _tabController,
        children: const [
          ConversationsPage(),
          NotificationsPage(),
        ],
      ),
    );
  }
}
