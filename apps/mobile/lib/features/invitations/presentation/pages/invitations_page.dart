import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/widgets/widgets.dart';
import '../../domain/entities/invitation_entity.dart';
import '../invitation_display.dart';
import '../bloc/invitations_bloc.dart';

class InvitationsPage extends StatefulWidget {
  const InvitationsPage({super.key});

  @override
  State<InvitationsPage> createState() => _InvitationsPageState();
}

class _InvitationsPageState extends State<InvitationsPage> {
  String _direction = 'all';
  String? _status;

  void _refresh() {
    context.read<InvitationsBloc>().add(
          InvitationsRequested(direction: _direction, status: _status),
        );
  }

  @override
  void initState() {
    super.initState();
    context
        .read<InvitationsBloc>()
        .add(const InvitationsRequested(direction: 'all'));
  }

  void _setDirection(String v) {
    setState(() => _direction = v);
    _refresh();
  }

  void _setStatus(String? v) {
    setState(() => _status = v);
    _refresh();
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
              'Invitations',
              style: theme.textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.w800,
              ),
            ),
            Text(
              'Collaboration requests',
              style: theme.textTheme.bodySmall?.copyWith(
                color: AppColors.mutedForeground,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            tooltip: 'Refresh',
            onPressed: _refresh,
            icon: const Icon(Icons.refresh_rounded),
          ),
        ],
      ),
      body: SafeArea(
        child: BlocBuilder<InvitationsBloc, InvitationsState>(
          builder: (context, state) {
            if (state.isLoading) {
              return const Center(child: CircularProgressIndicator());
            }
            if (state.status == InvitationsStatus.error) {
              return EmptyStateView(
                icon: Icons.mail_outline_rounded,
                title: 'Could not load invitations',
                message: state.error ?? 'Please try again.',
                actionLabel: 'Retry',
                onAction: _refresh,
              );
            }

            return Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Padding(
                  padding: AppSpacing.screenPaddingHorizontal
                      .copyWith(top: AppSpacing.sm),
                  child: Text(
                    'Filter by direction and status',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: AppColors.mutedForeground,
                    ),
                  ),
                ),
                AppSpacing.gapSm,
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  padding: AppSpacing.screenPaddingHorizontal,
                  child: Row(
                    children: [
                      _FilterChip(
                        label: 'All',
                        selected: _direction == 'all',
                        onTap: () => _setDirection('all'),
                      ),
                      _FilterChip(
                        label: 'Sent',
                        selected: _direction == 'sent',
                        onTap: () => _setDirection('sent'),
                      ),
                      _FilterChip(
                        label: 'Received',
                        selected: _direction == 'received',
                        onTap: () => _setDirection('received'),
                      ),
                    ],
                  ),
                ),
                AppSpacing.gapSm,
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  padding: AppSpacing.screenPaddingHorizontal,
                  child: Row(
                    children: [
                      _FilterChip(
                        label: 'Any status',
                        selected: _status == null,
                        onTap: () => _setStatus(null),
                      ),
                      _FilterChip(
                        label: 'Pending',
                        selected: _status == 'pending',
                        onTap: () => _setStatus('pending'),
                      ),
                      _FilterChip(
                        label: 'Accepted',
                        selected: _status == 'accepted',
                        onTap: () => _setStatus('accepted'),
                      ),
                      _FilterChip(
                        label: 'Declined',
                        selected: _status == 'declined',
                        onTap: () => _setStatus('declined'),
                      ),
                      _FilterChip(
                        label: 'Cancelled',
                        selected: _status == 'cancelled',
                        onTap: () => _setStatus('cancelled'),
                      ),
                      _FilterChip(
                        label: 'Expired',
                        selected: _status == 'expired',
                        onTap: () => _setStatus('expired'),
                      ),
                    ],
                  ),
                ),
                AppSpacing.gapMd,
                Expanded(
                  child: state.items.isEmpty
                      ? EmptyStateView(
                          icon: Icons.inbox_rounded,
                          title: 'No invitations',
                          message: _status != null || _direction != 'all'
                              ? 'Nothing matches these filters. Try broadening your search.'
                              : 'You do not have any invitations in this view yet.',
                          actionLabel:
                              _status != null || _direction != 'all'
                                  ? 'Reset filters'
                                  : 'Refresh',
                          onAction: _status != null || _direction != 'all'
                              ? () {
                                  setState(() {
                                    _direction = 'all';
                                    _status = null;
                                  });
                                  _refresh();
                                }
                              : _refresh,
                        )
                      : ListView.separated(
                          padding: AppSpacing.screenPadding.copyWith(bottom: 32),
                          itemCount: state.items.length,
                          separatorBuilder: (_, __) => AppSpacing.gapMd,
                          itemBuilder: (context, i) {
                            final inv = state.items[i];
                            final message = inv.message ?? '';
                            final accent = invitationStatusColor(inv.status);
                            final canRespond =
                                inv.id.isNotEmpty &&
                                inv.status == InvitationStatus.pending;

                            return Material(
                              color: AppColors.card,
                              elevation: 0,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(
                                  AppSpacing.radiusLg,
                                ),
                                side: const BorderSide(color: AppColors.border),
                              ),
                              child: Padding(
                                padding: AppSpacing.paddingMd,
                                child: Column(
                                  crossAxisAlignment:
                                      CrossAxisAlignment.stretch,
                                  children: [
                                    Align(
                                      alignment: Alignment.centerLeft,
                                      child: DecoratedBox(
                                        decoration: BoxDecoration(
                                          color: accent.withValues(alpha: 0.12),
                                          borderRadius: BorderRadius.circular(
                                            AppSpacing.radiusFull,
                                          ),
                                        ),
                                        child: Padding(
                                          padding: const EdgeInsets.symmetric(
                                            horizontal: AppSpacing.md,
                                            vertical: AppSpacing.xs,
                                          ),
                                          child: Text(
                                            invitationStatusLabel(inv.status)
                                                .toUpperCase(),
                                            style: theme.textTheme.labelSmall
                                                ?.copyWith(
                                              color: accent,
                                              fontWeight: FontWeight.w800,
                                              letterSpacing: 0.35,
                                            ),
                                          ),
                                        ),
                                      ),
                                    ),
                                    if (message.isNotEmpty) ...[
                                      AppSpacing.gapSm,
                                      Text(
                                        message,
                                        style: theme.textTheme.bodyMedium
                                            ?.copyWith(height: 1.45),
                                      ),
                                    ],
                                    AppSpacing.gapMd,
                                    Row(
                                      children: [
                                        Expanded(
                                          child: FilledButton.tonal(
                                            onPressed: !canRespond
                                                ? null
                                                : () => context
                                                    .read<InvitationsBloc>()
                                                    .add(
                                                      InvitationRespondRequested(
                                                        invitationId: inv.id,
                                                        status: 'accepted',
                                                      ),
                                                    ),
                                            child: const Text('Accept'),
                                          ),
                                        ),
                                        const SizedBox(width: AppSpacing.sm),
                                        Expanded(
                                          child: OutlinedButton(
                                            onPressed: !canRespond
                                                ? null
                                                : () => context
                                                    .read<InvitationsBloc>()
                                                    .add(
                                                      InvitationRespondRequested(
                                                        invitationId: inv.id,
                                                        status: 'declined',
                                                      ),
                                                    ),
                                            child: const Text('Decline'),
                                          ),
                                        ),
                                        IconButton(
                                          tooltip: 'Cancel invitation',
                                          onPressed: !canRespond
                                              ? null
                                              : () => context
                                                  .read<InvitationsBloc>()
                                                  .add(
                                                    InvitationCancelRequested(
                                                      inv.id,
                                                    ),
                                                  ),
                                          icon: const Icon(
                                            Icons.cancel_outlined,
                                          ),
                                        ),
                                      ],
                                    ),
                                    AppSpacing.gapSm,
                                    Text(
                                      'Ref: ${inv.id.isEmpty ? '—' : inv.id}',
                                      style: theme.textTheme.bodySmall?.copyWith(
                                        color: AppColors.mutedForeground,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
                ),
              ],
            );
          },
        ),
      ),
    );
  }
}

class _FilterChip extends StatelessWidget {
  const _FilterChip({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(right: AppSpacing.sm),
      child: Material(
        color: selected
            ? Theme.of(context).colorScheme.primary.withValues(alpha: 0.14)
            : AppColors.muted,
        borderRadius: BorderRadius.circular(AppSpacing.radiusFull),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(AppSpacing.radiusFull),
          child: Padding(
            padding: const EdgeInsets.symmetric(
              horizontal: AppSpacing.md,
              vertical: AppSpacing.sm,
            ),
            child: Text(
              label,
              style: Theme.of(context).textTheme.labelLarge?.copyWith(
                    fontWeight: FontWeight.w700,
                    color: selected
                        ? Theme.of(context).colorScheme.primary
                        : AppColors.mutedForeground,
                  ),
            ),
          ),
        ),
      ),
    );
  }
}
