import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../theme/app_colors.dart';
import '../theme/app_spacing.dart';

class AppTextField extends StatelessWidget {
  final String? label;
  final String? hint;
  final TextEditingController? controller;
  final IconData? prefixIcon;
  final Widget? suffix;
  final Widget? prefix;
  final bool obscureText;
  final TextInputType? keyboardType;
  final String? errorText;
  final bool enabled;
  final bool autofocus;
  final int? maxLines;
  final int? maxLength;
  final TextCapitalization textCapitalization;
  final List<TextInputFormatter>? inputFormatters;
  final ValueChanged<String>? onChanged;
  final VoidCallback? onTap;
  final FocusNode? focusNode;
  final TextInputAction? textInputAction;
  final ValueChanged<String>? onSubmitted;
  final String? Function(String?)? validator;

  const AppTextField({
    super.key,
    this.label,
    this.hint,
    this.controller,
    this.prefixIcon,
    this.suffix,
    this.prefix,
    this.obscureText = false,
    this.keyboardType,
    this.errorText,
    this.enabled = true,
    this.autofocus = false,
    this.maxLines = 1,
    this.maxLength,
    this.textCapitalization = TextCapitalization.none,
    this.inputFormatters,
    this.onChanged,
    this.onTap,
    this.focusNode,
    this.textInputAction,
    this.onSubmitted,
    this.validator,
  });

  @override
  Widget build(BuildContext context) {
    /// Builds a labeled TextFormField with consistent decoration and optional
    /// prefix/suffix widgets, validation and submit handling.
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        if (label != null) ...[
          Text(
            label!,
            style: Theme.of(context).textTheme.labelLarge?.copyWith(
                  color: AppColors.foreground,
                  fontWeight: FontWeight.w500,
                ),
          ),
          const SizedBox(height: AppSpacing.sm),
        ],
        TextFormField(
          controller: controller,
          obscureText: obscureText,
          keyboardType: keyboardType,
          enabled: enabled,
          autofocus: autofocus,
          maxLines: maxLines,
          maxLength: maxLength,
          textCapitalization: textCapitalization,
          inputFormatters: inputFormatters,
          onChanged: onChanged,
          onTap: onTap,
          focusNode: focusNode,
          textInputAction: textInputAction,
          onFieldSubmitted: onSubmitted,
          validator: validator,
          style: Theme.of(context).textTheme.bodyLarge,
          decoration: InputDecoration(
            hintText: hint,
            errorText: errorText,
            prefixIcon: prefixIcon != null
                ? Icon(
                    prefixIcon,
                    color: AppColors.mutedForeground,
                    size: 20,
                  )
                : prefix,
            suffixIcon: suffix,
            contentPadding: const EdgeInsets.symmetric(
              horizontal: AppSpacing.md,
              vertical: AppSpacing.md,
            ),
            constraints: const BoxConstraints(
              minHeight: AppSpacing.inputHeight,
            ),
          ),
        ),
      ],
    );
  }
}

class AppPasswordField extends StatefulWidget {
  final String? label;
  final String? hint;
  final TextEditingController? controller;
  final String? errorText;
  final bool enabled;
  final FocusNode? focusNode;
  final TextInputAction? textInputAction;
  final ValueChanged<String>? onSubmitted;
  final ValueChanged<String>? onChanged;
  final String? Function(String?)? validator;

  const AppPasswordField({
    super.key,
    this.label,
    this.hint,
    this.controller,
    this.errorText,
    this.enabled = true,
    this.focusNode,
    this.textInputAction,
    this.onSubmitted,
    this.onChanged,
    this.validator,
  });

  @override
  State<AppPasswordField> createState() => _AppPasswordFieldState();
}

class _AppPasswordFieldState extends State<AppPasswordField> {
  bool _obscureText = true;

  @override
  Widget build(BuildContext context) {
    return AppTextField(
      label: widget.label,
      hint: widget.hint ?? '••••••••',
      controller: widget.controller,
      prefixIcon: Icons.lock_outline,
      obscureText: _obscureText,
      errorText: widget.errorText,
      enabled: widget.enabled,
      focusNode: widget.focusNode,
      textInputAction: widget.textInputAction,
      onSubmitted: widget.onSubmitted,
      onChanged: widget.onChanged,
      validator: widget.validator,
      suffix: IconButton(
        icon: Icon(
          _obscureText ? Icons.visibility_off_outlined : Icons.visibility_outlined,
          color: AppColors.mutedForeground,
          size: 20,
        ),
        onPressed: () {
          setState(() {
            _obscureText = !_obscureText;
          });
        },
      ),
    );
  }
}
