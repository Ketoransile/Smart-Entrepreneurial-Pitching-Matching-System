import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/widgets/widgets.dart';
import '../bloc/messaging_bloc.dart';

class ChatPage extends StatefulWidget {
  final String conversationId;
  const ChatPage({super.key, required this.conversationId});

  @override
  State<ChatPage> createState() => _ChatPageState();
}

class _ChatPageState extends State<ChatPage> {
  final _controller = TextEditingController();

  @override
  void initState() {
    super.initState();
    context.read<MessagingBloc>().add(
          MessagesRequested(widget.conversationId, page: 1, limit: 30),
        );
    context.read<MessagingBloc>().add(
          ConversationReadRequested(widget.conversationId),
        );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _reload() {
    context.read<MessagingBloc>().add(
          MessagesRequested(widget.conversationId, page: 1, limit: 30),
        );
  }

  void _send() {
    final text = _controller.text.trim();
    if (text.isEmpty) return;
    _controller.clear();
    context.read<MessagingBloc>().add(
          MessageSendRequested(
            conversationId: widget.conversationId,
            body: text,
          ),
        );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final shortId = widget.conversationId.length > 18
        ? '${widget.conversationId.substring(0, 18)}…'
        : widget.conversationId;

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Chat',
              style: theme.textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.w800,
              ),
            ),
            Text(
              shortId,
              style: theme.textTheme.bodySmall?.copyWith(
                color: AppColors.mutedForeground,
                fontWeight: FontWeight.w500,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
        actions: [
          IconButton(
            tooltip: 'Refresh',
            icon: const Icon(Icons.refresh_rounded),
            onPressed: _reload,
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: Padding(
                padding: AppSpacing.screenPadding.copyWith(bottom: 0),
                child: BlocBuilder<MessagingBloc, MessagingState>(
                  builder: (context, state) {
                    if (state.isLoading && state.messages.isEmpty) {
                      return const Center(child: CircularProgressIndicator());
                    }
                    if (state.status == MessagingStatus.error &&
                        state.messages.isEmpty) {
                      return EmptyStateView(
                        icon: Icons.wifi_off_rounded,
                        title: 'Could not load messages',
                        message: state.error ?? 'Pull to refresh or try again.',
                        actionLabel: 'Retry',
                        onAction: _reload,
                      );
                    }
                    final msgs = state.messages;
                    if (msgs.isEmpty) {
                      return const EmptyStateView(
                        icon: Icons.chat_outlined,
                        title: 'No messages yet',
                        message:
                            'Say hello to start the thread. Your note will appear here.',
                      );
                    }

                    return LayoutBuilder(
                      builder: (context, constraints) {
                        final maxBubble = constraints.maxWidth * 0.88;
                        return RefreshIndicator(
                          onRefresh: () async {
                            _reload();
                            await Future<void>.delayed(
                              const Duration(milliseconds: 400),
                            );
                          },
                          child: ListView.separated(
                            reverse: true,
                            physics: const AlwaysScrollableScrollPhysics(),
                            itemCount: msgs.length,
                            separatorBuilder: (_, __) => AppSpacing.gapSm,
                            itemBuilder: (context, i) {
                              final m = msgs[msgs.length - 1 - i];
                              return Align(
                                alignment: Alignment.centerLeft,
                                child: ConstrainedBox(
                                  constraints:
                                      BoxConstraints(maxWidth: maxBubble),
                                  child: Material(
                                    color: AppColors.muted,
                                    elevation: 0,
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(16),
                                      side: const BorderSide(
                                        color: AppColors.border,
                                      ),
                                    ),
                                    child: Padding(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 14,
                                        vertical: 10,
                                      ),
                                      child: Text(
                                        m.body,
                                        style: theme.textTheme.bodyMedium
                                            ?.copyWith(height: 1.45),
                                      ),
                                    ),
                                  ),
                                ),
                              );
                            },
                          ),
                        );
                      },
                    );
                  },
                ),
              ),
            ),
            Material(
              elevation: 8,
              shadowColor: AppColors.foreground.withValues(alpha: 0.08),
              color: theme.colorScheme.surface,
              child: Padding(
                padding: AppSpacing.screenPadding.copyWith(
                  top: AppSpacing.sm,
                  bottom: AppSpacing.sm,
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Expanded(
                      child: AppTextField(
                        hint: 'Type a message',
                        controller: _controller,
                        textInputAction: TextInputAction.send,
                        maxLines: 4,
                        onSubmitted: (_) => _send(),
                      ),
                    ),
                    const SizedBox(width: AppSpacing.sm),
                    FilledButton(
                      onPressed: _send,
                      style: FilledButton.styleFrom(
                        padding: const EdgeInsets.all(14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                      ),
                      child: const Icon(Icons.send_rounded, size: 22),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
