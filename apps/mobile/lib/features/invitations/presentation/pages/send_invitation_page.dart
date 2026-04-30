import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/widgets/widgets.dart';
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
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Send invitation',
              style: theme.textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.w800,
              ),
            ),
            Text(
              'Match · ${widget.matchId}',
              style: theme.textTheme.bodySmall?.copyWith(
                color: AppColors.mutedForeground,
                fontWeight: FontWeight.w500,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
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
                child: ListView(
                  children: [
                    Text(
                      'Add a short note and choose how long the invitation stays open.',
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: AppColors.mutedForeground,
                        height: 1.45,
                      ),
                    ),
                    AppSpacing.gapLg,
                    Material(
                      color: AppColors.card,
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                        borderRadius:
                            BorderRadius.circular(AppSpacing.radiusLg),
                        side: const BorderSide(color: AppColors.border),
                      ),
                      child: Padding(
                        padding: AppSpacing.paddingMd,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            AppTextField(
                              label: 'Message',
                              controller: _message,
                              maxLines: 4,
                              validator: (v) =>
                                  (v == null || v.trim().isEmpty)
                                      ? 'Message required'
                                      : null,
                            ),
                            AppSpacing.gapMd,
                            AppTextField(
                              label: 'Expires in days',
                              controller: _expires,
                              keyboardType: TextInputType.number,
                            ),
                          ],
                        ),
                      ),
                    ),
                    AppSpacing.gapLg,
                    if (state.status == SendInvitationStatus.error)
                      Padding(
                        padding: const EdgeInsets.only(bottom: AppSpacing.md),
                        child: Text(
                          state.error ?? 'Failed to send invitation',
                          style: TextStyle(
                            color: theme.colorScheme.error,
                          ),
                        ),
                      ),
                    AppButton(
                      text: state.isLoading ? 'Sending...' : 'Send invitation',
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
