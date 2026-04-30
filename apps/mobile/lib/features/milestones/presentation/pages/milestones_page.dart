import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/widgets/widgets.dart';
import '../milestone_display.dart';
import '../bloc/milestones_bloc.dart';

class MilestonesPage extends StatefulWidget {
  const MilestonesPage({super.key});

  @override
  State<MilestonesPage> createState() => _MilestonesPageState();
}

class _MilestonesPageState extends State<MilestonesPage> {
  @override
  void initState() {
    super.initState();
    context.read<MilestonesBloc>().add(const MilestonesRequested());
  }

  void _reload() {
    context.read<MilestonesBloc>().add(const MilestonesRequested());
  }

  void _createDialog() {
    final submissionId = TextEditingController();
    final matchResultId = TextEditingController();
    final title = TextEditingController();
    final amount = TextEditingController();
    final dueDate = TextEditingController(
      text: DateTime.now().add(const Duration(days: 14)).toIso8601String(),
    );

    showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Create milestone'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              AppTextField(label: 'Submission ID', controller: submissionId),
              AppSpacing.gapSm,
              AppTextField(label: 'MatchResult ID', controller: matchResultId),
              AppSpacing.gapSm,
              AppTextField(label: 'Title', controller: title),
              AppSpacing.gapSm,
              AppTextField(
                label: 'Amount',
                controller: amount,
                keyboardType: TextInputType.number,
              ),
              AppSpacing.gapSm,
              AppTextField(label: 'Due date (ISO)', controller: dueDate),
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
              context.read<MilestonesBloc>().add(
                    MilestoneCreated({
                      'submissionId': submissionId.text.trim(),
                      'matchResultId': matchResultId.text.trim(),
                      'title': title.text.trim(),
                      'amount': double.tryParse(amount.text.trim()) ?? 0,
                      'dueDate': dueDate.text.trim(),
                    }),
                  );
            },
            child: const Text('Create'),
          ),
        ],
      ),
    );
  }

  void _evidenceDialog(String milestoneId) {
    final name = TextEditingController();
    final url = TextEditingController();
    final type = TextEditingController(text: 'report');

    showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Submit evidence'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            AppTextField(label: 'Name', controller: name),
            AppSpacing.gapSm,
            AppTextField(label: 'URL', controller: url),
            AppSpacing.gapSm,
            AppTextField(label: 'Type', controller: type),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () {
              Navigator.pop(ctx);
              context.read<MilestonesBloc>().add(
                    MilestoneEvidenceSubmitted(
                      id: milestoneId,
                      payload: {
                        'evidenceDocuments': [
                          {
                            'name': name.text.trim(),
                            'url': url.text.trim(),
                            'type': type.text.trim(),
                          },
                        ],
                      },
                    ),
                  );
            },
            child: const Text('Submit'),
          ),
        ],
      ),
    );
  }

  void _verifyDialog(String milestoneId) {
    final approved = ValueNotifier<bool>(true);
    final notes = TextEditingController();

    showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Verify milestone'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ValueListenableBuilder<bool>(
              valueListenable: approved,
              builder: (_, v, __) => SwitchListTile(
                value: v,
                onChanged: (nv) => approved.value = nv,
                title: const Text('Approved'),
              ),
            ),
            AppTextField(label: 'Notes', controller: notes, maxLines: 3),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () {
              Navigator.pop(ctx);
              context.read<MilestonesBloc>().add(
                    MilestoneVerified(
                      id: milestoneId,
                      payload: {
                        'approved': approved.value,
                        'notes': notes.text.trim(),
                      },
                    ),
                  );
            },
            child: const Text('Submit'),
          ),
        ],
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
              'Milestones',
              style: theme.textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.w800,
              ),
            ),
            Text(
              'Evidence & verification',
              style: theme.textTheme.bodySmall?.copyWith(
                color: AppColors.mutedForeground,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            tooltip: 'Add milestone',
            icon: const Icon(Icons.add_rounded),
            onPressed: _createDialog,
          ),
          IconButton(
            tooltip: 'Refresh',
            icon: const Icon(Icons.refresh_rounded),
            onPressed: _reload,
          ),
        ],
      ),
      body: SafeArea(
        child: BlocBuilder<MilestonesBloc, MilestonesState>(
          builder: (context, state) {
            if (state.isLoading) {
              return const Center(child: CircularProgressIndicator());
            }
            if (state.status == MilestonesStatus.error) {
              return EmptyStateView(
                icon: Icons.flag_outlined,
                title: 'Could not load milestones',
                message: state.error ?? 'Please try again.',
                actionLabel: 'Retry',
                onAction: _reload,
              );
            }
            if (state.items.isEmpty) {
              return EmptyStateView(
                icon: Icons.flag_circle_outlined,
                title: 'No milestones',
                message:
                    'Create milestones to track deliverables with investors.',
                actionLabel: 'Add milestone',
                onAction: _createDialog,
              );
            }

            return ListView.separated(
              padding: AppSpacing.screenPadding.copyWith(bottom: 32),
              itemCount: state.items.length,
              separatorBuilder: (_, __) => AppSpacing.gapMd,
              itemBuilder: (context, i) {
                final m = state.items[i];
                final statusLabel = milestoneStatusLabel(m.status);

                return Material(
                  color: AppColors.card,
                  elevation: 0,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
                    side: const BorderSide(color: AppColors.border),
                  ),
                  child: Padding(
                    padding: AppSpacing.paddingMd,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Text(
                                m.title.isEmpty ? 'Milestone' : m.title,
                                style: theme.textTheme.titleSmall?.copyWith(
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ),
                            DecoratedBox(
                              decoration: BoxDecoration(
                                color: AppColors.warning.withValues(alpha: 0.15),
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
                                  style: theme.textTheme.labelSmall?.copyWith(
                                    color: AppColors.warning,
                                    fontWeight: FontWeight.w800,
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                        if (m.amount > 0) ...[
                          AppSpacing.gapSm,
                          Text(
                            '${m.amount} ${m.currency}',
                            style: theme.textTheme.bodyMedium,
                          ),
                        ],
                        AppSpacing.gapMd,
                        Wrap(
                          spacing: AppSpacing.sm,
                          runSpacing: AppSpacing.sm,
                          children: [
                            OutlinedButton(
                              onPressed:
                                  m.id.isEmpty ? null : () => _evidenceDialog(m.id),
                              child: const Text('Evidence'),
                            ),
                            FilledButton.tonal(
                              onPressed:
                                  m.id.isEmpty ? null : () => _verifyDialog(m.id),
                              child: const Text('Verify'),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                );
              },
            );
          },
        ),
      ),
    );
  }
}
