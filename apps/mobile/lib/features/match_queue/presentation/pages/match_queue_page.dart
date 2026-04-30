import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/widgets/widgets.dart';
import '../../../matching/domain/entities/match_result_entity.dart';
import '../../../matching/presentation/match_display.dart';
import '../bloc/match_queue_bloc.dart';

class MatchQueuePage extends StatefulWidget {
  const MatchQueuePage({super.key});

  @override
  State<MatchQueuePage> createState() => _MatchQueuePageState();
}

class _MatchQueuePageState extends State<MatchQueuePage> {
  String? _filter;

  void _refresh() {
    context
        .read<MatchQueueBloc>()
        .add(MatchQueueRequested(statusFilter: _filter));
  }

  @override
  void initState() {
    super.initState();
    context.read<MatchQueueBloc>().add(const MatchQueueRequested());
  }

  void _setFilter(String? value) {
    setState(() => _filter = value);
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
              'Matches',
              style: theme.textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.w800,
              ),
            ),
            Text(
              'Review introductions with founders',
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
            icon: const Icon(Icons.refresh_rounded),
            onPressed: _refresh,
          ),
        ],
      ),
      body: SafeArea(
        child: BlocBuilder<MatchQueueBloc, MatchQueueState>(
          builder: (context, state) {
            if (state.status == MatchQueueStatus.loading) {
              return const Center(child: CircularProgressIndicator());
            }
            if (state.status == MatchQueueStatus.error) {
              return EmptyStateView(
                icon: Icons.link_off_rounded,
                title: 'Could not load matches',
                message: state.error ?? 'Please try again shortly.',
                actionLabel: 'Retry',
                onAction: _refresh,
              );
            }
            if (state.items.isEmpty) {
              return EmptyStateView(
                icon: Icons.handshake_outlined,
                title: 'No matches here',
                message: _filter == null
                    ? 'When the system suggests founders, they will appear in this queue.'
                    : 'Nothing with this status. Try another filter.',
                actionLabel: _filter != null ? 'Clear filter' : 'Refresh',
                onAction:
                    _filter != null ? () => _setFilter(null) : _refresh,
              );
            }

            return Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Padding(
                  padding: AppSpacing.screenPaddingHorizontal
                      .copyWith(top: AppSpacing.sm, bottom: AppSpacing.sm),
                  child: SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: [
                        _FilterChip(
                          label: 'All',
                          selected: _filter == null,
                          onTap: () => _setFilter(null),
                        ),
                        _FilterChip(
                          label: 'Pending',
                          selected: _filter == 'pending',
                          onTap: () => _setFilter('pending'),
                        ),
                        _FilterChip(
                          label: 'Requested',
                          selected: _filter == 'requested',
                          onTap: () => _setFilter('requested'),
                        ),
                        _FilterChip(
                          label: 'Accepted',
                          selected: _filter == 'accepted',
                          onTap: () => _setFilter('accepted'),
                        ),
                        _FilterChip(
                          label: 'Declined',
                          selected: _filter == 'declined',
                          onTap: () => _setFilter('declined'),
                        ),
                        _FilterChip(
                          label: 'Expired',
                          selected: _filter == 'expired',
                          onTap: () => _setFilter('expired'),
                        ),
                      ],
                    ),
                  ),
                ),
                Expanded(
                  child: ListView.separated(
                    padding: AppSpacing.screenPadding.copyWith(bottom: 100),
                    itemCount: state.items.length,
                    separatorBuilder: (_, __) => AppSpacing.gapMd,
                    itemBuilder: (context, i) {
                      final m = state.items[i];
                      final scorePct = (m.score * 100).clamp(0, 100).round();
                      final statusColor = matchStatusAccent(m.status);

                      return Material(
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
                              Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  SizedBox(
                                    width: 56,
                                    height: 56,
                                    child: Stack(
                                      alignment: Alignment.center,
                                      children: [
                                        SizedBox(
                                          width: 52,
                                          height: 52,
                                          child: CircularProgressIndicator(
                                            value: m.score.clamp(0.0, 1.0),
                                            strokeWidth: 5,
                                            backgroundColor: AppColors.muted,
                                            color: AppColors.primary,
                                          ),
                                        ),
                                        Text(
                                          '$scorePct',
                                          style: theme.textTheme.labelLarge
                                              ?.copyWith(
                                            fontWeight: FontWeight.w800,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  const SizedBox(width: AppSpacing.md),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          'Fit score',
                                          style: theme.textTheme.labelSmall
                                              ?.copyWith(
                                            color: AppColors.mutedForeground,
                                            fontWeight: FontWeight.w600,
                                          ),
                                        ),
                                        Text(
                                          '${m.score.toStringAsFixed(2)} compatibility',
                                          style: theme.textTheme.bodyMedium
                                              ?.copyWith(
                                            fontWeight: FontWeight.w600,
                                          ),
                                        ),
                                        if (m.rank != null) ...[
                                          AppSpacing.gapXs,
                                          Text(
                                            'Rank #${m.rank}',
                                            style: theme.textTheme.bodySmall
                                                ?.copyWith(
                                              color: AppColors.mutedForeground,
                                            ),
                                          ),
                                        ],
                                      ],
                                    ),
                                  ),
                                  DecoratedBox(
                                    decoration: BoxDecoration(
                                      color: statusColor.withValues(alpha: 0.12),
                                      borderRadius: BorderRadius.circular(
                                        AppSpacing.radiusFull,
                                      ),
                                    ),
                                    child: Padding(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: AppSpacing.sm,
                                        vertical: AppSpacing.xs,
                                      ),
                                      child: Text(
                                        matchStatusLabel(m.status).toUpperCase(),
                                        style: theme.textTheme.labelSmall
                                            ?.copyWith(
                                          color: statusColor,
                                          fontWeight: FontWeight.w800,
                                          letterSpacing: 0.4,
                                        ),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              AppSpacing.gapMd,
                              Row(
                                children: [
                                  Expanded(
                                    child: FilledButton.tonal(
                                      onPressed: (m.id.isEmpty ||
                                              m.status ==
                                                  MatchStatus.accepted)
                                          ? null
                                          : () => context
                                              .read<MatchQueueBloc>()
                                              .add(
                                                MatchStatusChanged(
                                                  matchId: m.id,
                                                  newStatus: 'accepted',
                                                ),
                                              ),
                                      child: const Text('Accept'),
                                    ),
                                  ),
                                  const SizedBox(width: AppSpacing.sm),
                                  Expanded(
                                    child: OutlinedButton(
                                      onPressed: (m.id.isEmpty ||
                                              m.status ==
                                                  MatchStatus.declined)
                                          ? null
                                          : () => context
                                              .read<MatchQueueBloc>()
                                              .add(
                                                MatchStatusChanged(
                                                  matchId: m.id,
                                                  newStatus: 'declined',
                                                ),
                                              ),
                                      child: const Text('Decline'),
                                    ),
                                  ),
                                ],
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
