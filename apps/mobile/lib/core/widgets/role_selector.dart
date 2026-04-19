import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../theme/app_spacing.dart';
import '../../features/auth/domain/entities/user_entity.dart';

class RoleSelector extends StatelessWidget {
  final UserRole selectedRole;
  final ValueChanged<UserRole> onRoleChanged;
  final bool enabled;

  const RoleSelector({
    super.key,
    required this.selectedRole,
    required this.onRoleChanged,
    this.enabled = true,
  });

  @override
  Widget build(BuildContext context) {
    /// Presents a compact role selector with two tappable options.
    /// Calls `onRoleChanged` with the selected `UserRole` when tapped.
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: AppColors.muted.withValues(alpha: 0.5),
        borderRadius: AppSpacing.borderRadiusMd,
        border: Border.all(
          color: AppColors.border.withValues(alpha: 0.5),
        ),
      ),
      child: Row(
        children: [
          Expanded(
            child: _RoleButton(
              label: 'Entrepreneur',
              isSelected: selectedRole == UserRole.entrepreneur,
              onTap: enabled
                  ? () => onRoleChanged(UserRole.entrepreneur)
                  : null,
            ),
          ),
          Expanded(
            child: _RoleButton(
              label: 'Investor',
              isSelected: selectedRole == UserRole.investor,
              onTap: enabled ? () => onRoleChanged(UserRole.investor) : null,
            ),
          ),
        ],
      ),
    );
  }
}

class _RoleButton extends StatelessWidget {
  final String label;
  final bool isSelected;
  final VoidCallback? onTap;

  const _RoleButton({
    required this.label,
    required this.isSelected,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        curve: Curves.easeInOut,
        padding: const EdgeInsets.symmetric(
          vertical: AppSpacing.sm + 2,
        ),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.background : Colors.transparent,
          borderRadius: AppSpacing.borderRadiusSm,
          border: isSelected
              ? Border.all(color: AppColors.border.withValues(alpha: 0.5))
              : null,
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.05),
                    blurRadius: 4,
                    offset: const Offset(0, 1),
                  ),
                ]
              : null,
        ),
        child: Center(
          child: AnimatedDefaultTextStyle(
            duration: const Duration(milliseconds: 200),
            style: Theme.of(context).textTheme.bodyMedium!.copyWith(
                  fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                  color: isSelected
                      ? AppColors.foreground
                      : AppColors.mutedForeground,
                ),
            child: Text(label),
          ),
        ),
      ),
    );
  }
}
