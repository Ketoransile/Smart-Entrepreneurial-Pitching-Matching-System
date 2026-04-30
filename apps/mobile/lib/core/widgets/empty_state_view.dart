import 'package:flutter/material.dart';

import '../theme/app_colors.dart';
import '../theme/app_spacing.dart';
import 'app_button.dart';

/// Centered empty state with icon, title, and optional action.
class EmptyStateView extends StatelessWidget {
  const EmptyStateView({
    super.key,
    required this.icon,
    required this.title,
    this.message,
    this.actionLabel,
    this.onAction,
  });

  final IconData icon;
  final String title;
  final String? message;
  final String? actionLabel;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Center(
      child: Padding(
        padding: AppSpacing.paddingLg,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            DecoratedBox(
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.08),
                shape: BoxShape.circle,
              ),
              child: Padding(
                padding: const EdgeInsets.all(AppSpacing.lg),
                child: Icon(
                  icon,
                  size: 40,
                  color: AppColors.primary.withValues(alpha: 0.85),
                ),
              ),
            ),
            AppSpacing.gapLg,
            Text(
              title,
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w700,
              ),
              textAlign: TextAlign.center,
            ),
            if (message != null && message!.isNotEmpty) ...[
              AppSpacing.gapSm,
              Text(
                message!,
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: AppColors.mutedForeground,
                  height: 1.45,
                ),
                textAlign: TextAlign.center,
              ),
            ],
            if (actionLabel != null && onAction != null) ...[
              AppSpacing.gapLg,
              AppButton(text: actionLabel!, onPressed: onAction),
            ],
          ],
        ),
      ),
    );
  }
}
