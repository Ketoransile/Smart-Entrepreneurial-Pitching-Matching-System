import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/widgets/widgets.dart';
import '../../../../core/di/injection_container.dart';
import '../../../matching/presentation/bloc/matching_bloc.dart';
import '../../../matching/presentation/pages/match_results_page.dart';
import '../../domain/entities/submission_entity.dart';
import '../submission_display.dart';
import '../bloc/submissions_bloc.dart';

class MySubmissionsPage extends StatefulWidget {
  const MySubmissionsPage({super.key});

  @override
  State<MySubmissionsPage> createState() => _MySubmissionsPageState();
}

class _MySubmissionsPageState extends State<MySubmissionsPage> {
  @override
  void initState() {
    super.initState();
    context.read<SubmissionsBloc>().add(const MySubmissionsRequested());
  }

  void _reload() {
    context.read<SubmissionsBloc>().add(const MySubmissionsRequested());
  }

  void _createDraftDialog() {
    final title = TextEditingController();
    final sector = TextEditingController();
    final stage = TextEditingController();

    showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('New pitch draft'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              AppTextField(label: 'Title', controller: title),
              AppSpacing.gapSm,
              AppTextField(label: 'Sector', controller: sector),
              AppSpacing.gapSm,
              AppTextField(
                label: 'Stage',
                hint: 'idea / mvp / early-revenue / scaling',
                controller: stage,
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
              context.read<SubmissionsBloc>().add(
                    SubmissionDraftCreated(
                      title: title.text.trim(),
                      sector: sector.text.trim(),
                      stage: stage.text.trim(),
                    ),
                  );
            },
            child: const Text('Create'),
          ),
        ],
      ),
    );
  }

  Color _statusAccent(SubmissionStatus status) {
    return switch (status) {
      SubmissionStatus.draft => AppColors.mutedForeground,
      SubmissionStatus.submitted => AppColors.primary,
      SubmissionStatus.underReview => AppColors.warning,
      SubmissionStatus.approved => AppColors.success,
      SubmissionStatus.rejected => AppColors.destructive,
      SubmissionStatus.suspended => AppColors.destructive,
      SubmissionStatus.matched => AppColors.primaryDark,
      SubmissionStatus.closed => AppColors.mutedForeground,
    };
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
              'My pitches',
              style: theme.textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.w800,
              ),
            ),
            Text(
              'Drafts, submissions, and matching',
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
            onPressed: _reload,
            icon: const Icon(Icons.refresh_rounded),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _createDraftDialog,
        icon: const Icon(Icons.add_rounded),
        label: const Text('New pitch'),
      ),
      body: SafeArea(
        child: BlocBuilder<SubmissionsBloc, SubmissionsState>(
          builder: (context, state) {
            if (state.isLoading) {
              return const Center(child: CircularProgressIndicator());
            }
            if (state.status == SubmissionsStatus.error) {
              return EmptyStateView(
                icon: Icons.cloud_off_outlined,
                title: 'Could not load pitches',
                message: state.error ?? 'Please try again in a moment.',
                actionLabel: 'Retry',
                onAction: _reload,
              );
            }
            if (state.items.isEmpty) {
              return EmptyStateView(
                icon: Icons.post_add_rounded,
                title: 'No pitches yet',
                message:
                    'Create your first draft to shape your story and submit when you are ready for investors.',
                actionLabel: 'New pitch',
                onAction: _createDraftDialog,
              );
            }

            return RefreshIndicator(
              onRefresh: () async => _reload(),
              child: ListView.separated(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: AppSpacing.screenPadding.copyWith(bottom: 120),
                itemCount: state.items.length + 1,
                separatorBuilder: (_, __) => AppSpacing.gapMd,
                itemBuilder: (context, i) {
                  if (i == 0) {
                    return Text(
                      'Your workspace',
                      style: theme.textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w700,
                        color: AppColors.mutedForeground,
                      ),
                    );
                  }
                  final s = state.items[i - 1];
                  final accent = _statusAccent(s.status);

                  return Container(
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.03),
                          blurRadius: 4,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    padding: const EdgeInsets.all(AppSpacing.md),
                    margin: const EdgeInsets.symmetric(vertical: 2),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        PitchPreviewCard(
                          title: s.title,
                          sector: s.sector.isEmpty ? 'General' : s.sector,
                          stageLabel: submissionStageLabel(s.stage),
                          summary: s.summary,
                        ),
                        AppSpacing.gapSm,
                        Align(
                          alignment: Alignment.centerLeft,
                          child: DecoratedBox(
                            decoration: BoxDecoration(
                              color: accent.withAlpha(30),
                              borderRadius:
                                  BorderRadius.circular(AppSpacing.radiusFull),
                            ),
                            child: Padding(
                              padding: const EdgeInsets.symmetric(
                                horizontal: AppSpacing.md,
                                vertical: AppSpacing.xs,
                              ),
                              child: Text(
                                submissionStatusLabel(s.status).toUpperCase(),
                                style: theme.textTheme.labelSmall?.copyWith(
                                  color: accent,
                                  fontWeight: FontWeight.w800,
                                  letterSpacing: 0.35,
                                ),
                              ),
                            ),
                          ),
                        ),
                        AppSpacing.gapMd,
                        Row(
                          children: [
                            Expanded(
                              child: OutlinedButton(
                                onPressed: s.id.isEmpty
                                    ? null
                                    : () => context.read<SubmissionsBloc>().add(
                                          SubmissionCompletenessRequested(s.id),
                                        ),
                                child: const Text('Completeness'),
                              ),
                            ),
                            const SizedBox(width: AppSpacing.sm),
                            Expanded(
                              child: FilledButton.tonal(
                                onPressed: s.id.isEmpty
                                    ? null
                                    : () => context.read<SubmissionsBloc>().add(
                                          SubmissionSubmitted(s.id),
                                        ),
                                child: const Text('Submit'),
                              ),
                            ),
                          ],
                        ),
                        AppSpacing.gapSm,
                        SizedBox(
                          width: double.infinity,
                          child: OutlinedButton.icon(
                            onPressed: s.id.isEmpty
                                ? null
                                : () {
                                    Navigator.push<void>(
                                      context,
                                      MaterialPageRoute<void>(
                                        builder: (_) =>
                                            BlocProvider<MatchingBloc>(
                                          create: (_) => sl<MatchingBloc>(),
                                          child: MatchResultsPage(
                                            submissionId: s.id,
                                          ),
                                        ),
                                      ),
                                    );
                                  },
                            icon: const Icon(Icons.hub_outlined, size: 18),
                            label: const Text('Matching results'),
                          ),
                        ),
                        TextButton(
                          onPressed: s.id.isEmpty
                              ? null
                              : () => context.read<SubmissionsBloc>().add(
                                    SubmissionDraftDeleted(s.id),
                                  ),
                          style: TextButton.styleFrom(
                            foregroundColor: AppColors.destructive,
                          ),
                          child: const Text('Delete draft'),
                        ),
                      ],
                    ),
                  );
                },
              ),
            );
          },
        ),
      ),
    );
  }
}
