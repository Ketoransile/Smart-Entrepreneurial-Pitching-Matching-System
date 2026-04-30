import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/widgets/widgets.dart';
import '../meeting_display.dart';
import '../bloc/meetings_bloc.dart';

class MeetingsPage extends StatefulWidget {
  const MeetingsPage({super.key});

  @override
  State<MeetingsPage> createState() => _MeetingsPageState();
}

class _MeetingsPageState extends State<MeetingsPage> {
  String? _status;

  void _refresh() {
    context.read<MeetingsBloc>().add(MeetingsRequested(status: _status));
  }

  @override
  void initState() {
    super.initState();
    context.read<MeetingsBloc>().add(const MeetingsRequested());
  }

  void _scheduleDialog() {
    final title = TextEditingController();
    final when = TextEditingController(
      text: DateTime.now().add(const Duration(days: 1)).toIso8601String(),
    );
    final duration = TextEditingController(text: '30');
    final participants = TextEditingController();
    final meetingUrl = TextEditingController();

    showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Schedule meeting'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              AppTextField(label: 'Title', controller: title),
              AppSpacing.gapSm,
              AppTextField(label: 'ScheduledAt (ISO)', controller: when),
              AppSpacing.gapSm,
              AppTextField(
                label: 'Duration minutes',
                controller: duration,
                keyboardType: TextInputType.number,
              ),
              AppSpacing.gapSm,
              AppTextField(
                label: 'Participants (comma userIds)',
                controller: participants,
              ),
              AppSpacing.gapSm,
              AppTextField(
                label: 'Meeting URL (optional)',
                controller: meetingUrl,
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () {
              Navigator.pop(ctx);
              final ids = participants.text
                  .split(',')
                  .map((e) => e.trim())
                  .where((e) => e.isNotEmpty)
                  .toList();
              context.read<MeetingsBloc>().add(
                    MeetingScheduled({
                      'title': title.text.trim(),
                      'scheduledAt': when.text.trim(),
                      'durationMinutes':
                          int.tryParse(duration.text.trim()) ?? 30,
                      'participants': ids,
                      if (meetingUrl.text.trim().isNotEmpty)
                        'meetingUrl': meetingUrl.text.trim(),
                    }),
                  );
            },
            child: const Text('Create'),
          ),
        ],
      ),
    );
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
              'Meetings',
              style: theme.textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.w800,
              ),
            ),
            Text(
              'Schedule & follow-ups',
              style: theme.textTheme.bodySmall?.copyWith(
                color: AppColors.mutedForeground,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            tooltip: 'New meeting',
            icon: const Icon(Icons.add_rounded),
            onPressed: _scheduleDialog,
          ),
          IconButton(
            tooltip: 'Refresh',
            icon: const Icon(Icons.refresh_rounded),
            onPressed: _refresh,
          ),
        ],
      ),
      body: SafeArea(
        child: BlocBuilder<MeetingsBloc, MeetingsState>(
          builder: (context, state) {
            if (state.isLoading) {
              return const Center(child: CircularProgressIndicator());
            }
            if (state.status == MeetingsStatus.error) {
              return EmptyStateView(
                icon: Icons.event_busy_rounded,
                title: 'Could not load meetings',
                message: state.error ?? 'Please try again.',
                actionLabel: 'Retry',
                onAction: _refresh,
              );
            }
            if (state.items.isEmpty) {
              return EmptyStateView(
                icon: Icons.event_available_rounded,
                title: 'No meetings',
                message: _status != null
                    ? 'No meetings for this status filter.'
                    : 'Schedule your first meeting to align with investors.',
                actionLabel: _status != null ? 'Clear filter' : 'Schedule',
                onAction: _status != null
                    ? () => _setStatus(null)
                    : _scheduleDialog,
              );
            }

            return Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Padding(
                  padding: AppSpacing.screenPaddingHorizontal
                      .copyWith(top: AppSpacing.sm),
                  child: SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: [
                        _StatusChip(
                          label: 'All',
                          selected: _status == null,
                          onTap: () => _setStatus(null),
                        ),
                        _StatusChip(
                          label: 'Scheduled',
                          selected: _status == 'scheduled',
                          onTap: () => _setStatus('scheduled'),
                        ),
                        _StatusChip(
                          label: 'Ongoing',
                          selected: _status == 'ongoing',
                          onTap: () => _setStatus('ongoing'),
                        ),
                        _StatusChip(
                          label: 'Completed',
                          selected: _status == 'completed',
                          onTap: () => _setStatus('completed'),
                        ),
                        _StatusChip(
                          label: 'Cancelled',
                          selected: _status == 'cancelled',
                          onTap: () => _setStatus('cancelled'),
                        ),
                      ],
                    ),
                  ),
                ),
                AppSpacing.gapMd,
                Expanded(
                  child: ListView.separated(
                    padding: AppSpacing.screenPadding.copyWith(bottom: 32),
                    itemCount: state.items.length,
                    separatorBuilder: (_, __) => AppSpacing.gapMd,
                    itemBuilder: (context, i) {
                      final m = state.items[i];
                      final when = m.scheduledAt.toLocal().toString();
                      final statusLabel = meetingStatusLabel(m.status);

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
                                  Expanded(
                                    child: Text(
                                      m.title.isEmpty ? 'Meeting' : m.title,
                                      style: theme.textTheme.titleSmall?.copyWith(
                                        fontWeight: FontWeight.w700,
                                      ),
                                    ),
                                  ),
                                  DecoratedBox(
                                    decoration: BoxDecoration(
                                      color: AppColors.primary
                                          .withValues(alpha: 0.1),
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
                                        statusLabel.toUpperCase(),
                                        style: theme.textTheme.labelSmall
                                            ?.copyWith(
                                          color: AppColors.primary,
                                          fontWeight: FontWeight.w800,
                                        ),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              if (when.isNotEmpty) ...[
                                AppSpacing.gapSm,
                                Text(
                                  when,
                                  style: theme.textTheme.bodySmall?.copyWith(
                                    color: AppColors.mutedForeground,
                                  ),
                                ),
                              ],
                              if ((m.meetingUrl ?? '').isNotEmpty) ...[
                                AppSpacing.gapXs,
                                SelectableText(
                                  m.meetingUrl!,
                                  style: theme.textTheme.bodySmall?.copyWith(
                                    color: AppColors.primary,
                                  ),
                                ),
                              ],
                              AppSpacing.gapMd,
                              Row(
                                children: [
                                  Expanded(
                                    child: FilledButton.tonal(
                                      onPressed: m.id.isEmpty
                                          ? null
                                          : () {
                                              context.read<MeetingsBloc>().add(
                                                    MeetingStatusUpdated(
                                                      meetingId: m.id,
                                                      payload: {
                                                        'status': 'completed',
                                                      },
                                                    ),
                                                  );
                                            },
                                      child: const Text('Complete'),
                                    ),
                                  ),
                                  const SizedBox(width: AppSpacing.sm),
                                  Expanded(
                                    child: OutlinedButton(
                                      onPressed: m.id.isEmpty
                                          ? null
                                          : () {
                                              context.read<MeetingsBloc>().add(
                                                    MeetingStatusUpdated(
                                                      meetingId: m.id,
                                                      payload: {
                                                        'status': 'cancelled',
                                                      },
                                                    ),
                                                  );
                                            },
                                      child: const Text('Cancel'),
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

class _StatusChip extends StatelessWidget {
  const _StatusChip({
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
