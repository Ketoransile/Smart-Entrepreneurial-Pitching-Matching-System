import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

class AppDividerWithText extends StatelessWidget {
  final String text;

  const AppDividerWithText({
    super.key,
    required this.text,
  });

  @override
  Widget build(BuildContext context) {
    /// Builds a horizontal divider with centered uppercase text.
    /// Used to separate sections with a small label.
    return Row(
      children: [
        const Expanded(
          child: Divider(
            color: AppColors.border,
            thickness: 1,
          ),
        ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Text(
            text.toUpperCase(),
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  color: AppColors.mutedForeground,
                  letterSpacing: 0.5,
                ),
          ),
        ),
        const Expanded(
          child: Divider(
            color: AppColors.border,
            thickness: 1,
          ),
        ),
      ],
    );
  }
}
