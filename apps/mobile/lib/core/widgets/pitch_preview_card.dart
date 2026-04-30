import 'package:flutter/material.dart';

import '../theme/app_colors.dart';
import '../theme/app_spacing.dart';

/// Tappable pitch row used on investor feed and saved lists.
class PitchPreviewCard extends StatelessWidget {
  const PitchPreviewCard({
    super.key,
    required this.title,
    required this.sector,
    required this.stageLabel,
    this.summary,
    this.trailing,
    this.onTap,
  });

  final String title;
  final String sector;
  final String stageLabel;
  final String? summary;
  final Widget? trailing;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final displayTitle = title.isEmpty ? 'Untitled pitch' : title;

    final content = Padding(
      padding: AppSpacing.paddingMd,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
              DecoratedBox(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      AppColors.primary.withValues(alpha: 0.12),
                      AppColors.primary.withValues(alpha: 0.06),
                    ],
                  ),
                  borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
                ),
                child: const SizedBox(
                  width: 44,
                  height: 44,
                  child: Icon(
                    Icons.rocket_launch_outlined,
                    color: AppColors.primary,
                    size: 22,
                  ),
                ),
              ),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      displayTitle,
                      style: theme.textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w700,
                        height: 1.25,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    AppSpacing.gapXs,
                    Wrap(
                      spacing: AppSpacing.sm,
                      runSpacing: AppSpacing.xs,
                      children: [
                        _MetaChip(icon: Icons.category_outlined, label: sector),
                        _MetaChip(
                          icon: Icons.trending_up_outlined,
                          label: stageLabel,
                        ),
                      ],
                    ),
                    if (summary != null && summary!.trim().isNotEmpty) ...[
                      AppSpacing.gapSm,
                      Text(
                        summary!.trim(),
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: AppColors.mutedForeground,
                          height: 1.4,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ],
                ),
              ),
              if (trailing != null) ...[
                const SizedBox(width: AppSpacing.sm),
                trailing!,
              ] else if (onTap != null) ...[
                const SizedBox(width: AppSpacing.sm),
                Icon(
                  Icons.arrow_forward_ios_rounded,
                  size: 14,
                  color: AppColors.mutedForeground.withValues(alpha: 0.7),
                ),
              ],
        ],
      ),
    );

    return Material(
      color: AppColors.card,
      elevation: 0,
      shadowColor: Colors.transparent,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
        side: const BorderSide(color: AppColors.border, width: 1),
      ),
      clipBehavior: Clip.antiAlias,
      child: onTap != null
          ? InkWell(onTap: onTap, child: content)
          : content,
    );
  }
}

class _MetaChip extends StatelessWidget {
  const _MetaChip({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.sm,
        vertical: AppSpacing.xs,
      ),
      decoration: BoxDecoration(
        color: AppColors.muted,
        borderRadius: BorderRadius.circular(AppSpacing.radiusFull),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: AppColors.mutedForeground),
          const SizedBox(width: 4),
          Text(
            label,
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  color: AppColors.mutedForeground,
                  fontWeight: FontWeight.w600,
                ),
          ),
        ],
      ),
    );
  }
}
