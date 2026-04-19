import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/theme/app_spacing.dart';
import '../../../../core/widgets/app_button.dart';
import '../../../../core/widgets/app_text_field.dart';
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
    context.read<MessagingBloc>().add(MessagesRequested(widget.conversationId, page: 1, limit: 30));
    context.read<MessagingBloc>().add(ConversationReadRequested(widget.conversationId));
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _send() {
    final text = _controller.text.trim();
    if (text.isEmpty) return;
    _controller.clear();
    context.read<MessagingBloc>().add(
          MessageSendRequested(conversationId: widget.conversationId, body: text),
        );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Chat'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => context
                .read<MessagingBloc>()
                .add(MessagesRequested(widget.conversationId, page: 1, limit: 30)),
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: Padding(
                padding: AppSpacing.screenPadding,
                child: BlocBuilder<MessagingBloc, MessagingState>(
                  builder: (context, state) {
                    if (state.isLoading && state.messages.isEmpty) {
                      return const Center(child: CircularProgressIndicator());
                    }
                    if (state.status == MessagingStatus.error && state.messages.isEmpty) {
                      return Center(child: Text(state.error ?? 'Failed to load messages'));
                    }
                    final msgs = state.messages;
                    if (msgs.isEmpty) return const Center(child: Text('No messages yet.'));

                    return ListView.builder(
                      reverse: true,
                      itemCount: msgs.length,
                      itemBuilder: (context, i) {
                        final m = msgs[msgs.length - 1 - i];
                        return Align(
                          alignment: Alignment.centerLeft,
                          child: Container(
                            margin: const EdgeInsets.symmetric(vertical: 4),
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: Theme.of(context).colorScheme.surfaceContainerHighest,
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Text(m.body),
                          ),
                        );
                      },
                    );
                  },
                ),
              ),
            ),
            Padding(
              padding: AppSpacing.screenPadding,
              child: Row(
                children: [
                  Expanded(
                    child: AppTextField(
                      label: '',
                      hint: 'Type a message',
                      controller: _controller,
                      textInputAction: TextInputAction.send,
                      onSubmitted: (_) => _send(),
                    ),
                  ),
                  const SizedBox(width: 8),
                  SizedBox(
                    width: 96,
                    child: AppButton(text: 'Send', onPressed: _send),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

