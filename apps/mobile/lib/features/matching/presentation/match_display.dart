import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../domain/entities/match_result_entity.dart';

String matchStatusLabel(MatchStatus status) {
  return switch (status) {
    MatchStatus.pending => 'Pending',
    MatchStatus.requested => 'Requested',
    MatchStatus.accepted => 'Accepted',
    MatchStatus.declined => 'Declined',
    MatchStatus.expired => 'Expired',
  };
}

Color matchStatusAccent(MatchStatus status) {
  return switch (status) {
    MatchStatus.accepted => AppColors.success,
    MatchStatus.declined => AppColors.destructive,
    MatchStatus.expired => AppColors.mutedForeground,
    MatchStatus.requested => AppColors.primary,
    MatchStatus.pending => AppColors.warning,
  };
}
