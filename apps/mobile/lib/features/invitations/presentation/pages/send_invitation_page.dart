import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/theme/app_spacing.dart';
import '../../../../core/widgets/app_button.dart';
import '../../../../core/widgets/app_text_field.dart';
import '../bloc/send_invitation_bloc.dart';

class SendInvitationPage extends StatefulWidget {
  final String matchId;
  const SendInvitationPage({super.key, required this.matchId});

  @override
  State<SendInvitationPage> createState() => _SendInvitationPageState();
}

class _SendInvitationPageState extends State<SendInvitationPage> {
  final _formKey = GlobalKey<FormState>();
  final _message = TextEditingController();
  final _expires = TextEditingController(text: '10');

  @override
  void dispose() {
    _message.dispose();
    _expires.dispose();
    super.dispose();
  }

  void _send() {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    final expires = int.tryParse(_expires.text.trim());
    context.read<SendInvitationBloc>().add(
          SendInvitationRequested(
            matchId: widget.matchId,
            message: _message.text.trim(),
            expiresInDays: expires,
          ),
        );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Send invitation')),
      body: SafeArea(
        child: Padding(
          padding: AppSpacing.screenPadding,
          child: BlocConsumer<SendInvitationBloc, SendInvitationState>(
            listener: (context, state) {
              if (state.status == SendInvitationStatus.sent) {
                Navigator.pop(context, true);
              }
            },
            builder: (context, state) {
              return Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Text('Match ID: ${widget.matchId}'),
                    AppSpacing.gapMd,
                    AppTextField(
                      label: 'Message',
                      controller: _message,
                      maxLines: 4,
                      validator: (v) =>
                          (v == null || v.trim().isEmpty) ? 'Message required' : null,
                    ),
                    AppSpacing.gapMd,
                    AppTextField(
                      label: 'Expires in days',
                      controller: _expires,
                      keyboardType: TextInputType.number,
                    ),
                    AppSpacing.gapLg,
                    if (state.status == SendInvitationStatus.error)
                      Text(
                        state.error ?? 'Failed to send invitation',
                        style: TextStyle(color: Theme.of(context).colorScheme.error),
                      ),
                    AppSpacing.gapMd,
                    AppButton(
                      text: state.isLoading ? 'Sending...' : 'Send',
                      onPressed: state.isLoading ? null : _send,
                      isLoading: state.isLoading,
                    ),
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

