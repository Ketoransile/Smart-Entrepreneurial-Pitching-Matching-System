import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/widgets/app_button.dart';
import '../../../../core/di/injection_container.dart';
import '../../../saved_pitches/presentation/bloc/saved_pitches_bloc.dart';
import '../../../submissions/presentation/submission_display.dart';
import '../bloc/feed_bloc.dart';

class PitchDetailPage extends StatefulWidget {
  final String pitchId;
  const PitchDetailPage({super.key, required this.pitchId});

  @override
  State<PitchDetailPage> createState() => _PitchDetailPageState();
}

class _PitchDetailPageState extends State<PitchDetailPage> {
  @override
  void initState() {
    super.initState();
    context.read<FeedBloc>().add(PitchRequested(widget.pitchId));
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Pitch overview'),
      ),
      body: SafeArea(
        child: BlocBuilder<FeedBloc, FeedState>(
          builder: (context, state) {
            if (state.isLoading) {
              return const Center(child: CircularProgressIndicator());
            }
            if (state.status == FeedStatus.error) {
              return Center(
                child: Padding(
                  padding: AppSpacing.screenPadding,
                  child: Text(
                    state.error ??
                        'Could not load pitch details. Please try again.',
                    textAlign: TextAlign.center,
                    style: theme.textTheme.bodyLarge,
                  ),
                ),
              );
            }
            final p = state.pitch;
            if (p == null) {
              return Center(
                child: Text(
                  'Pitch details are unavailable right now.',
                  style: theme.textTheme.bodyLarge,
                ),
              );
            }

            final title = p.title.isEmpty ? 'Untitled pitch' : p.title;

            return ListView(
              padding: AppSpacing.screenPadding.copyWith(bottom: 32),
              children: [
                Text(
                  title,
                  style: theme.textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.w800,
                    height: 1.2,
                  ),
                ),
                AppSpacing.gapMd,
                Wrap(
                  spacing: AppSpacing.sm,
                  runSpacing: AppSpacing.xs,
                  children: [
                    _DetailChip(
                      icon: Icons.category_outlined,
                      label: p.sector.isEmpty ? 'General' : p.sector,
                    ),
                    _DetailChip(
                      icon: Icons.trending_up_outlined,
                      label: submissionStageLabel(p.stage),
                    ),
                    if (p.targetAmount != null)
                      _DetailChip(
                        icon: Icons.payments_outlined,
                        label:
                            '${p.currency} ${p.targetAmount!.toStringAsFixed(0)}',
                      ),
                  ],
                ),
                if (p.summary.trim().isNotEmpty) ...[
                  AppSpacing.gapLg,
                  Text(
                    'Summary',
                    style: theme.textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  AppSpacing.gapSm,
                  Text(
                    p.summary.trim(),
                    style: theme.textTheme.bodyMedium?.copyWith(
                      height: 1.5,
                      color: AppColors.foreground.withValues(alpha: 0.88),
                    ),
                  ),
                ],
                AppSpacing.gapLg,
                Text(
                  'Problem',
                  style: theme.textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
                ),
                AppSpacing.gapSm,
                Text(
                  p.problem.statement.isEmpty
                      ? 'Not provided yet.'
                      : p.problem.statement,
                  style: theme.textTheme.bodyMedium?.copyWith(height: 1.45),
                ),
                AppSpacing.gapXl,
                AppButton(
                  text: 'Save to list',
                  onPressed: () async {
                    final tempBloc = sl<SavedPitchesBloc>();
                    tempBloc.add(SavedPitchToggled(widget.pitchId));
                    await tempBloc.stream.firstWhere(
                      (s) => s.status != SavedPitchesStatus.loading,
                    );
                    await tempBloc.close();
                    if (!context.mounted) return;
                    Navigator.pop(context);
                  },
                ),
              ],
            );
          },
        ),
      ),
    );
  }
}

class _DetailChip extends StatelessWidget {
  const _DetailChip({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.md,
        vertical: AppSpacing.sm,
      ),
      decoration: BoxDecoration(
        color: AppColors.primary.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(AppSpacing.radiusFull),
        border: Border.all(
          color: AppColors.primary.withValues(alpha: 0.2),
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 18, color: AppColors.primary),
          const SizedBox(width: 6),
          Text(
            label,
            style: Theme.of(context).textTheme.labelLarge?.copyWith(
                  color: AppColors.primary,
                  fontWeight: FontWeight.w700,
                ),
          ),
        ],
      ),
    );
  }
}
