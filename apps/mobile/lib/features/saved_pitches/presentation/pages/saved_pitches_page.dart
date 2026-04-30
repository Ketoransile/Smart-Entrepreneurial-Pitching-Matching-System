import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/widgets/widgets.dart';
import '../../../submissions/presentation/submission_display.dart';
import '../bloc/saved_pitches_bloc.dart';

class SavedPitchesPage extends StatefulWidget {
  const SavedPitchesPage({super.key});

  @override
  State<SavedPitchesPage> createState() => _SavedPitchesPageState();
}

class _SavedPitchesPageState extends State<SavedPitchesPage> {
  @override
  void initState() {
    super.initState();
    context.read<SavedPitchesBloc>().add(const SavedPitchesRequested());
  }

  void _reload() {
    context.read<SavedPitchesBloc>().add(const SavedPitchesRequested());
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
              'Saved',
              style: theme.textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.w800,
              ),
            ),
            Text(
              'Shortlisted opportunities',
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
            onPressed: _reload,
          ),
        ],
      ),
      body: SafeArea(
        child: BlocBuilder<SavedPitchesBloc, SavedPitchesState>(
          builder: (context, state) {
            if (state.isLoading) {
              return const Center(child: CircularProgressIndicator());
            }
            if (state.status == SavedPitchesStatus.error) {
              return EmptyStateView(
                icon: Icons.bookmark_remove_outlined,
                title: 'Could not load saved pitches',
                message: state.error ?? 'Please try again in a moment.',
                actionLabel: 'Retry',
                onAction: _reload,
              );
            }
            if (state.items.isEmpty) {
              return EmptyStateView(
                icon: Icons.bookmark_add_outlined,
                title: 'No saved pitches yet',
                message:
                    'Tap the bookmark on a pitch to save it here for quick access.',
                actionLabel: 'Refresh',
                onAction: _reload,
              );
            }

            return RefreshIndicator(
              onRefresh: () async => _reload(),
              child: ListView.separated(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: AppSpacing.screenPadding.copyWith(top: 8, bottom: 100),
                itemCount: state.items.length,
                separatorBuilder: (_, __) => AppSpacing.gapMd,
                itemBuilder: (context, i) {
                  final p = state.items[i];
                  return PitchPreviewCard(
                    title: p.title,
                    sector: p.sector.isEmpty ? 'General' : p.sector,
                    stageLabel: submissionStageLabel(p.stage),
                    summary: p.summary,
                    trailing: IconButton(
                      tooltip: 'Remove from saved',
                      style: IconButton.styleFrom(
                        foregroundColor: AppColors.destructive,
                      ),
                      icon: const Icon(Icons.bookmark_remove_rounded),
                      onPressed: p.id.isEmpty
                          ? null
                          : () => context
                              .read<SavedPitchesBloc>()
                              .add(SavedPitchToggled(p.id)),
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
