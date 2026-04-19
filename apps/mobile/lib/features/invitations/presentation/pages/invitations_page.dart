import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/theme/app_spacing.dart';
import '../bloc/invitations_bloc.dart';

class InvitationsPage extends StatefulWidget {
  const InvitationsPage({super.key});

  @override
  State<InvitationsPage> createState() => _InvitationsPageState();
}

class _InvitationsPageState extends State<InvitationsPage> {
  String _direction = 'all';
  String? _status;

  @override
  void initState() {
    super.initState();
    context.read<InvitationsBloc>().add(const InvitationsRequested(direction: 'all'));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Invitations'),
        actions: [
          DropdownButton<String>(
            value: _direction,
            underline: const SizedBox.shrink(),
            items: const [
              DropdownMenuItem(value: 'all', child: Text('All')),
              DropdownMenuItem(value: 'sent', child: Text('Sent')),
              DropdownMenuItem(value: 'received', child: Text('Received')),
            ],
            onChanged: (v) {
              if (v == null) return;
              setState(() => _direction = v);
              context.read<InvitationsBloc>().add(
                    InvitationsRequested(direction: _direction, status: _status),
                  );
            },
          ),
          const SizedBox(width: 8),
          DropdownButton<String?>(
            value: _status,
            underline: const SizedBox.shrink(),
            items: const [
              DropdownMenuItem(value: null, child: Text('Any')),
              DropdownMenuItem(value: 'pending', child: Text('Pending')),
              DropdownMenuItem(value: 'accepted', child: Text('Accepted')),
              DropdownMenuItem(value: 'declined', child: Text('Declined')),
              DropdownMenuItem(value: 'cancelled', child: Text('Cancelled')),
              DropdownMenuItem(value: 'expired', child: Text('Expired')),
            ],
            onChanged: (v) {
              setState(() => _status = v);
              context.read<InvitationsBloc>().add(
                    InvitationsRequested(direction: _direction, status: _status),
                  );
            },
          ),
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => context.read<InvitationsBloc>().add(
                  InvitationsRequested(direction: _direction, status: _status),
                ),
          ),
        ],
      ),
      body: SafeArea(
        child: Padding(
          padding: AppSpacing.screenPadding,
          child: BlocBuilder<InvitationsBloc, InvitationsState>(
            builder: (context, state) {
              if (state.isLoading) return const Center(child: CircularProgressIndicator());
              if (state.status == InvitationsStatus.error) {
                return Center(child: Text(state.error ?? 'Failed to load invitations'));
              }
              if (state.items.isEmpty) {
                return const Center(child: Text('No invitations.'));
              }
              return ListView.separated(
                itemCount: state.items.length,
                separatorBuilder: (_, __) => AppSpacing.gapSm,
                itemBuilder: (context, i) {
                  final inv = state.items[i];
                  return Card(
                    child: Padding(
                      padding: const EdgeInsets.all(12),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          Text('Status: ${inv.status}'),
                          if (inv.message.isNotEmpty) ...[
                            AppSpacing.gapXs,
                            Text(inv.message),
                          ],
                          AppSpacing.gapSm,
                          Row(
                            children: [
                              Expanded(
                                child: OutlinedButton(
                                  onPressed: (inv.id.isEmpty || inv.status != 'pending')
                                      ? null
                                      : () => context.read<InvitationsBloc>().add(
                                            InvitationRespondRequested(
                                              invitationId: inv.id,
                                              status: 'accepted',
                                            ),
                                          ),
                                  child: const Text('Accept'),
                                ),
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: OutlinedButton(
                                  onPressed: (inv.id.isEmpty || inv.status != 'pending')
                                      ? null
                                      : () => context.read<InvitationsBloc>().add(
                                            InvitationRespondRequested(
                                              invitationId: inv.id,
                                              status: 'declined',
                                            ),
                                          ),
                                  child: const Text('Decline'),
                                ),
                              ),
                              const SizedBox(width: 8),
                              IconButton(
                                onPressed: (inv.id.isEmpty || inv.status != 'pending')
                                    ? null
                                    : () => context
                                        .read<InvitationsBloc>()
                                        .add(InvitationCancelRequested(inv.id)),
                                icon: const Icon(Icons.cancel_outlined),
                                tooltip: 'Cancel',
                              ),
                            ],
                          ),
                          AppSpacing.gapXs,
                          Text('ID: ${inv.id}'),
                        ],
                      ),
                    ),
                  );
                },
              );
            },
          ),
        ),
      ),
    );
  }
}

