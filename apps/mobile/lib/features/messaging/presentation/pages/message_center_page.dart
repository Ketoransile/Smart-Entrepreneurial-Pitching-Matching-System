import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/theme/app_spacing.dart';
import '../bloc/messaging_bloc.dart';
import 'notifications_page.dart';
import 'conversations_page.dart';

class MessageCenterPage extends StatefulWidget {
  const MessageCenterPage({super.key});

  @override
  State<MessageCenterPage> createState() => _MessageCenterPageState();
}

class _MessageCenterPageState extends State<MessageCenterPage> {
  int _tab = 0;

  @override
  void initState() {
    super.initState();
    context.read<MessagingBloc>().add(const UnreadCountRequested());
    context.read<MessagingBloc>().add(const ConversationsRequested());
  }

  @override
  Widget build(BuildContext context) {
    final tabs = [
      const ConversationsPage(),
      const NotificationsPage(),
    ];

    return Scaffold(
      appBar: AppBar(
        title: const Text('Messages'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              context.read<MessagingBloc>().add(const UnreadCountRequested());
              context.read<MessagingBloc>().add(const ConversationsRequested());
              context.read<MessagingBloc>().add(const NotificationsRequested());
            },
          ),
          BlocBuilder<MessagingBloc, MessagingState>(
            builder: (context, state) => Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              child: Center(
                child: Text('Unread: ${state.unreadCount}'),
              ),
            ),
          ),
        ],
      ),
      body: SafeArea(
        child: Padding(
          padding: AppSpacing.screenPadding,
          child: tabs[_tab],
        ),
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _tab,
        onDestinationSelected: (i) {
          setState(() => _tab = i);
          if (i == 0) {
            context.read<MessagingBloc>().add(const ConversationsRequested());
          } else {
            context.read<MessagingBloc>().add(const NotificationsRequested());
          }
        },
        destinations: const [
          NavigationDestination(icon: Icon(Icons.chat_bubble_outline), label: 'Chats'),
          NavigationDestination(icon: Icon(Icons.notifications_outlined), label: 'Notifications'),
        ],
      ),
    );
  }
}

