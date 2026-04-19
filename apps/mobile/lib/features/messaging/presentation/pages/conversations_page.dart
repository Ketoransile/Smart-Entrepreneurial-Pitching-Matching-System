import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/theme/app_spacing.dart';
import '../bloc/messaging_bloc.dart';
import 'chat_page.dart';

class ConversationsPage extends StatelessWidget {
  const ConversationsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<MessagingBloc, MessagingState>(
      builder: (context, state) {
        if (state.isLoading && state.conversations.isEmpty) {
          return const Center(child: CircularProgressIndicator());
        }
        if (state.status == MessagingStatus.error && state.conversations.isEmpty) {
          return Center(child: Text(state.error ?? 'Failed to load conversations'));
        }
        if (state.conversations.isEmpty) {
          return const Center(child: Text('No conversations yet.'));
        }

        return ListView.separated(
          itemCount: state.conversations.length,
          separatorBuilder: (_, __) => AppSpacing.gapSm,
          itemBuilder: (context, i) {
            final c = state.conversations[i];
            return Card(
              child: ListTile(
                title: Text(c.otherUserName.isEmpty ? 'Conversation' : c.otherUserName),
                subtitle: Text('Unread: ${c.unreadCount}'),
                onTap: c.id.isEmpty
                    ? null
                    : () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => BlocProvider.value(
                              value: context.read<MessagingBloc>(),
                              child: ChatPage(conversationId: c.id),
                            ),
                          ),
                        );
                      },
              ),
            );
          },
        );
      },
    );
  }
}

