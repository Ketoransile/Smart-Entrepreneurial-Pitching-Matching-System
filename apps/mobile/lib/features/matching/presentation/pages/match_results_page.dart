import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/widgets/widgets.dart';
import '../../../../core/di/injection_container.dart';
import '../../domain/entities/match_result_entity.dart';
import '../match_display.dart';
import '../bloc/matching_bloc.dart';
import '../../../invitations/presentation/bloc/send_invitation_bloc.dart';
import '../../../invitations/presentation/pages/send_invitation_page.dart';

class MatchResultsPage extends StatefulWidget {
  final String submissionId;
  const MatchResultsPage({super.key, required this.submissionId});

  @override
  State<MatchResultsPage> createState() => _MatchResultsPageState();
}

class _MatchResultsPageState extends State<MatchResultsPage> {
  @override
  void initState() {
    super.initState();
    context
        .read<MatchingBloc>()
        .add(MatchingResultsRequested(widget.submissionId));
  }

  void _reload() {
    context
        .read<MatchingBloc>()
        .add(MatchingResultsRequested(widget.submissionId));
  }

  void _runMatching() {
    context
        .read<MatchingBloc>()
        .add(MatchingRunRequested(widget.submissionId));
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
              'Match results',
              style: theme.textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.w800,
              ),
            ),
            Text(
              'Investor fit for this pitch',
              style: theme.textTheme.bodySmall?.copyWith(
                color: AppColors.mutedForeground,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            tooltip: 'Run matching',
            icon: const Icon(Icons.auto_awesome_rounded),
            onPressed: _runMatching,
          ),
          IconButton(
            tooltip: 'Refresh',
            icon: const Icon(Icons.refresh_rounded),
            onPressed: _reload,
          ),
        ],
      ),
      body: SafeArea(
        child: BlocBuilder<MatchingBloc, MatchingState>(
          builder: (context, state) {
            if (state.isLoading) {
              return const Center(child: CircularProgressIndicator());
            }
            if (state.status == MatchingStatus.error) {
              return EmptyStateView(
                icon: Icons.hub_outlined,
                title: 'Could not load results',
                message: state.error ?? 'Try again in a moment.',
                actionLabel: 'Retry',
                onAction: _reload,
              );
            }
            if (state.results.isEmpty) {
              return EmptyStateView(
                icon: Icons.search_rounded,
                title: 'No matches yet',
                message:
                    'Run matching to generate a ranked list of investors for this submission.',
                actionLabel: 'Run matching',
                onAction: _runMatching,
              );
            }

            return RefreshIndicator(
              onRefresh: () async => _reload(),
              child: ListView.separated(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: AppSpacing.screenPadding.copyWith(bottom: 32),
                itemCount: state.results.length + 1,
                separatorBuilder: (_, __) => AppSpacing.gapMd,
                itemBuilder: (context, i) {
                  if (i == 0) {
                    return Text(
                      'Ranked investors',
                      style: theme.textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w700,
                        color: AppColors.mutedForeground,
                      ),
                    );
                  }
                  final r = state.results[i - 1];
                  final accent = matchStatusAccent(r.status);
                  final scorePct = (r.score * 100).clamp(0, 100).round();

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
                                width: 52,
                                height: 52,
                                child: Stack(
                                  alignment: Alignment.center,
                                  children: [
                                    SizedBox(
                                      width: 48,
                                      height: 48,
                                      child: CircularProgressIndicator(
                                        value: r.score.clamp(0.0, 1.0),
                                        strokeWidth: 4,
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
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      '${r.score.toStringAsFixed(2)} fit score',
                                      style: theme.textTheme.titleSmall?.copyWith(
                                        fontWeight: FontWeight.w700,
                                      ),
                                    ),
                                    AppSpacing.gapXs,
                                    Text(
                                      'Match ID · ${r.id.isEmpty ? '—' : r.id}',
                                      style: theme.textTheme.bodySmall?.copyWith(
                                        color: AppColors.mutedForeground,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              DecoratedBox(
                                decoration: BoxDecoration(
                                  color: accent.withValues(alpha: 0.12),
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
                                    matchStatusLabel(r.status).toUpperCase(),
                                    style: theme.textTheme.labelSmall?.copyWith(
                                      color: accent,
                                      fontWeight: FontWeight.w800,
                                      letterSpacing: 0.35,
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                          if (r.status == MatchStatus.accepted) ...[
                            AppSpacing.gapMd,
                            FilledButton.icon(
                              onPressed: r.id.isEmpty
                                  ? null
                                  : () {
                                      Navigator.push<void>(
                                        context,
                                        MaterialPageRoute<void>(
                                          builder: (_) =>
                                              BlocProvider<SendInvitationBloc>(
                                            create: (_) =>
                                                sl<SendInvitationBloc>(),
                                            child: SendInvitationPage(
                                              matchId: r.id,
                                            ),
                                          ),
                                        ),
                                      );
                                    },
                              icon: const Icon(Icons.send_rounded, size: 20),
                              label: const Text('Send invitation'),
                            ),
                          ],
                        ],
                      ),
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
