import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../theme/app_spacing.dart';

class GoogleSignInButton extends StatelessWidget {
  final VoidCallback? onPressed;
  final bool isLoading;
  final String text;

  const GoogleSignInButton({
    super.key,
    this.onPressed,
    this.isLoading = false,
    this.text = 'Continue with Google',
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      height: AppSpacing.buttonHeight,
      child: OutlinedButton(
        onPressed: isLoading ? null : onPressed,
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.foreground,
          side: const BorderSide(color: AppColors.border),
          shape: RoundedRectangleBorder(
            borderRadius: AppSpacing.borderRadiusMd,
          ),
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
        ),
        child: isLoading
            ? const SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: AppColors.primary,
                ),
              )
            : Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const _GoogleLogo(),
                  const SizedBox(width: AppSpacing.sm),
                  Text(
                    text,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          fontWeight: FontWeight.w500,
                        ),
                  ),
                ],
              ),
      ),
    );
  }
}

class _GoogleLogo extends StatelessWidget {
  const _GoogleLogo();

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 20,
      height: 20,
      child: CustomPaint(
        painter: _GoogleLogoPainter(),
      ),
    );
  }
}

class _GoogleLogoPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final double width = size.width;
    final double height = size.height;
    
    final Path bluePath = Path();
    bluePath.moveTo(width * 0.94, height * 0.51);
    bluePath.cubicTo(
      width * 0.94, height * 0.47,
      width * 0.937, height * 0.44,
      width * 0.932, height * 0.41,
    );
    bluePath.lineTo(width * 0.5, height * 0.41);
    bluePath.lineTo(width * 0.5, height * 0.59);
    bluePath.lineTo(width * 0.747, height * 0.59);
    bluePath.cubicTo(
      width * 0.735, height * 0.66,
      width * 0.695, height * 0.72,
      width * 0.632, height * 0.76,
    );
    bluePath.lineTo(width * 0.632, height * 0.87);
    bluePath.lineTo(width * 0.78, height * 0.87);
    bluePath.cubicTo(
      width * 0.867, height * 0.79,
      width * 0.94, height * 0.67,
      width * 0.94, height * 0.51,
    );
    bluePath.close();

    final Paint bluePaint = Paint()..color = AppColors.googleBlue;
    canvas.drawPath(bluePath, bluePaint);

    final Path greenPath = Path();
    greenPath.moveTo(width * 0.5, height * 0.958);
    greenPath.cubicTo(
      width * 0.624, height * 0.958,
      width * 0.728, height * 0.917,
      width * 0.804, height * 0.847,
    );
    greenPath.lineTo(width * 0.656, height * 0.73);
    greenPath.cubicTo(
      width * 0.615, height * 0.757,
      width * 0.563, height * 0.775,
      width * 0.5, height * 0.775,
    );
    greenPath.cubicTo(
      width * 0.38, height * 0.775,
      width * 0.28, height * 0.695,
      width * 0.243, height * 0.586,
    );
    greenPath.lineTo(width * 0.09, height * 0.586);
    greenPath.lineTo(width * 0.09, height * 0.703);
    greenPath.cubicTo(
      width * 0.166, height * 0.855,
      width * 0.321, height * 0.958,
      width * 0.5, height * 0.958,
    );
    greenPath.close();

    final Paint greenPaint = Paint()..color = AppColors.googleGreen;
    canvas.drawPath(greenPath, greenPaint);

    final Path yellowPath = Path();
    yellowPath.moveTo(width * 0.243, height * 0.587);
    yellowPath.cubicTo(
      width * 0.234, height * 0.56,
      width * 0.229, height * 0.53,
      width * 0.229, height * 0.5,
    );
    yellowPath.cubicTo(
      width * 0.229, height * 0.47,
      width * 0.234, height * 0.44,
      width * 0.243, height * 0.413,
    );
    yellowPath.lineTo(width * 0.243, height * 0.295);
    yellowPath.lineTo(width * 0.09, height * 0.295);
    yellowPath.cubicTo(
      width * 0.06, height * 0.356,
      width * 0.042, height * 0.426,
      width * 0.042, height * 0.5,
    );
    yellowPath.cubicTo(
      width * 0.042, height * 0.574,
      width * 0.06, height * 0.644,
      width * 0.09, height * 0.705,
    );
    yellowPath.lineTo(width * 0.243, height * 0.587);
    yellowPath.close();

    final Paint yellowPaint = Paint()..color = AppColors.googleYellow;
    canvas.drawPath(yellowPath, yellowPaint);

    final Path redPath = Path();
    redPath.moveTo(width * 0.5, height * 0.224);
    redPath.cubicTo(
      width * 0.568, height * 0.224,
      width * 0.627, height * 0.247,
      width * 0.675, height * 0.292,
    );
    redPath.lineTo(width * 0.806, height * 0.161);
    redPath.cubicTo(
      width * 0.728, height * 0.087,
      width * 0.624, height * 0.042,
      width * 0.5, height * 0.042,
    );
    redPath.cubicTo(
      width * 0.321, height * 0.042,
      width * 0.166, height * 0.145,
      width * 0.09, height * 0.295,
    );
    redPath.lineTo(width * 0.243, height * 0.413);
    redPath.cubicTo(
      width * 0.28, height * 0.305,
      width * 0.38, height * 0.224,
      width * 0.5, height * 0.224,
    );
    redPath.close();

    final Paint redPaint = Paint()..color = AppColors.googleRed;
    canvas.drawPath(redPath, redPaint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
