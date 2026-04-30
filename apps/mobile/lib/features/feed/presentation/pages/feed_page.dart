import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/widgets/widgets.dart';
import '../../../../core/di/injection_container.dart';
import '../../../saved_pitches/presentation/bloc/saved_pitches_bloc.dart';
import '../../../saved_pitches/presentation/pages/saved_pitches_page.dart';
import '../../../submissions/presentation/submission_display.dart';
import '../bloc/feed_bloc.dart';
import 'pitch_detail_page.dart';

class FeedPage extends StatefulWidget {
  const FeedPage({super.key});

  @override
  State<FeedPage> createState() => _FeedPageState();
}

class _FeedPageState extends State<FeedPage> {
  @override
  void initState() {
    super.initState();
    context
        .read<FeedBloc>()
        .add(const FeedRequested(sort: 'recent', page: 1, limit: 20));
  }

  void _reload() {
    context
        .read<FeedBloc>()
        .add(const FeedRequested(sort: 'recent', page: 1, limit: 20));
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
              'Discover',
              style: theme.textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.w800,
              ),
            ),
            Text(
              'Pitches matched to your thesis',
              style: theme.textTheme.bodySmall?.copyWith(
                color: AppColors.mutedForeground,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            tooltip: 'Saved pitches',
            icon: const Icon(Icons.bookmark_added_outlined),
            onPressed: () {
              Navigator.push<void>(
                context,
                MaterialPageRoute<void>(
                  builder: (_) => BlocProvider<SavedPitchesBloc>(
                    create: (_) => sl<SavedPitchesBloc>(),
                    child: const SavedPitchesPage(),
                  ),
                ),
              );
            },
          ),
          IconButton(
            tooltip: 'Refresh',
            icon: const Icon(Icons.refresh_rounded),
            onPressed: _reload,
          ),
        ],
      ),
      body: SafeArea(
        child: BlocBuilder<FeedBloc, FeedState>(
          builder: (context, state) {
            if (state.isLoading) {
              return const Center(child: CircularProgressIndicator());
            }
            if (state.status == FeedStatus.error) {
              return EmptyStateView(
                icon: Icons.cloud_off_outlined,
                title: 'Could not load pitches',
                message: state.error ??
                    'Check your connection and pull to refresh.',
                actionLabel: 'Try again',
                onAction: _reload,
              );
            }
            if (state.items.isEmpty) {
              return EmptyStateView(
                icon: Icons.explore_outlined,
                title: 'Nothing new yet',
                message:
                    'When founders publish pitches that fit your preferences, they will show up here.',
                actionLabel: 'Refresh',
                onAction: _reload,
              );
            }

            return RefreshIndicator(
              onRefresh: () async => _reload(),
              edgeOffset: 8,
              child: ListView.separated(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: AppSpacing.screenPadding.copyWith(top: 8, bottom: 100),
                itemCount: state.items.length + 1,
                separatorBuilder: (_, i) {
                  if (i == 0) return AppSpacing.gapMd;
                  return AppSpacing.gapMd;
                },
                itemBuilder: (context, i) {
                  if (i == 0) {
                    return Text(
                      'Recommended for you',
                      style: theme.textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w700,
                        color: AppColors.mutedForeground,
                      ),
                    );
                  }
                  final p = state.items[i - 1];
                  return PitchPreviewCard(
                    title: p.title,
                    sector: p.sector.isEmpty ? 'General' : p.sector,
                    stageLabel: submissionStageLabel(p.stage),
                    summary: p.summary,
                    onTap: p.id.isEmpty
                        ? null
                        : () {
                            Navigator.push<void>(
                              context,
                              MaterialPageRoute<void>(
                                builder: (_) => BlocProvider.value(
                                  value: context.read<FeedBloc>(),
                                  child: PitchDetailPage(pitchId: p.id),
                                ),
                              ),
                            );
                          },
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
