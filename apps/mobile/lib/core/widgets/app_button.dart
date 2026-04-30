import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../theme/app_spacing.dart';

enum AppButtonVariant { primary, outline, ghost, destructive, secondary }
enum AppButtonSize { small, medium, large }

class AppButton extends StatelessWidget {
  final String text;
  final VoidCallback? onPressed;
  final AppButtonVariant variant;
  final AppButtonSize size;
  final bool isLoading;
  final bool isFullWidth;
  final IconData? icon;
  final Widget? iconWidget;
  final bool iconOnRight;

  const AppButton({
    super.key,
    required this.text,
    this.onPressed,
    this.variant = AppButtonVariant.primary,
    this.size = AppButtonSize.medium,
    this.isLoading = false,
    this.isFullWidth = true,
    this.icon,
    this.iconWidget,
    this.iconOnRight = false,
  });

  double get _height {
    switch (size) {
      case AppButtonSize.small:
        return AppSpacing.buttonHeightSm;
      case AppButtonSize.medium:
        return AppSpacing.buttonHeight;
      case AppButtonSize.large:
        return AppSpacing.buttonHeightLg;
    }
  }

  double get _fontSize {
    switch (size) {
      case AppButtonSize.small:
        return 12;
      case AppButtonSize.medium:
        return 14;
      case AppButtonSize.large:
        return 16;
    }
  }

  EdgeInsets get _padding {
    switch (size) {
      case AppButtonSize.small:
        return const EdgeInsets.symmetric(horizontal: 12);
      case AppButtonSize.medium:
        return const EdgeInsets.symmetric(horizontal: 16);
      case AppButtonSize.large:
        return const EdgeInsets.symmetric(horizontal: 24);
    }
  }

  @override
  Widget build(BuildContext context) {
    final Widget child = _buildChild(context);

    switch (variant) {
      case AppButtonVariant.primary:
        return _buildElevatedButton(
          context,
          child,
          backgroundColor: AppColors.primary,
          foregroundColor: AppColors.primaryForeground,
        );
      case AppButtonVariant.destructive:
        return _buildElevatedButton(
          context,
          child,
          backgroundColor: AppColors.destructive,
          foregroundColor: AppColors.destructiveForeground,
        );
      case AppButtonVariant.secondary:
        return _buildElevatedButton(
          context,
          child,
          backgroundColor: AppColors.muted,
          foregroundColor: AppColors.foreground,
        );
      case AppButtonVariant.outline:
        return _buildOutlinedButton(context, child);
      case AppButtonVariant.ghost:
        return _buildGhostButton(context, child);
    }
  }

  Widget _buildChild(BuildContext context) {
    /// Builds the button's inner content: shows a loading indicator when
    /// `isLoading` is true, otherwise composes icon + text or plain text.
    if (isLoading) {
      return SizedBox(
        width: 20,
        height: 20,
        child: CircularProgressIndicator(
          strokeWidth: 2,
          color: variant == AppButtonVariant.primary ||
                  variant == AppButtonVariant.destructive
              ? AppColors.primaryForeground
              : AppColors.primary,
        ),
      );
    }

    final textWidget = Text(
      text,
      style: TextStyle(
        fontSize: _fontSize,
        fontWeight: FontWeight.w600,
      ),
    );

    if (icon != null || iconWidget != null) {
      final iconW = iconWidget ??
          Icon(
            icon,
            size: _fontSize + 4,
          );
      return Row(
        mainAxisSize: MainAxisSize.min,
        mainAxisAlignment: MainAxisAlignment.center,
        children: iconOnRight
            ? [textWidget, const SizedBox(width: 8), iconW]
            : [iconW, const SizedBox(width: 8), textWidget],
      );
    }

    return textWidget;
  }

  Widget _buildElevatedButton(
    BuildContext context,
    Widget child, {
    required Color backgroundColor,
    required Color foregroundColor,
  }) {
    return SizedBox(
      width: isFullWidth ? double.infinity : null,
      height: _height,
      child: ElevatedButton(
        onPressed: isLoading ? null : onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: backgroundColor,
          foregroundColor: foregroundColor,
          disabledBackgroundColor: backgroundColor.withOpacity(0.6),
          disabledForegroundColor: foregroundColor.withOpacity(0.6),
          elevation: 0,
          padding: _padding,
          shape: RoundedRectangleBorder(
            borderRadius: AppSpacing.borderRadiusMd,
          ),
        ),
        child: child,
      ),
    );
  }

  Widget _buildOutlinedButton(BuildContext context, Widget child) {
    return SizedBox(
      width: isFullWidth ? double.infinity : null,
      height: _height,
      child: OutlinedButton(
        onPressed: isLoading ? null : onPressed,
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.foreground,
          side: const BorderSide(color: AppColors.border),
          padding: _padding,
          shape: RoundedRectangleBorder(
            borderRadius: AppSpacing.borderRadiusMd,
          ),
        ),
        child: child,
      ),
    );
  }

  Widget _buildGhostButton(BuildContext context, Widget child) {
    return SizedBox(
      width: isFullWidth ? double.infinity : null,
      height: _height,
      child: TextButton(
        onPressed: isLoading ? null : onPressed,
        style: TextButton.styleFrom(
          foregroundColor: AppColors.foreground,
          padding: _padding,
          shape: RoundedRectangleBorder(
            borderRadius: AppSpacing.borderRadiusMd,
          ),
        ),
        child: child,
      ),
    );
  }
}
