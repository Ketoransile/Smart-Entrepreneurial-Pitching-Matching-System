import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../domain/entities/invitation_entity.dart';

String invitationStatusLabel(InvitationStatus status) {
  return switch (status) {
    InvitationStatus.pending => 'Pending',
    InvitationStatus.accepted => 'Accepted',
    InvitationStatus.declined => 'Declined',
    InvitationStatus.cancelled => 'Cancelled',
    InvitationStatus.expired => 'Expired',
  };
}

Color invitationStatusColor(InvitationStatus status) {
  return switch (status) {
    InvitationStatus.pending => AppColors.warning,
    InvitationStatus.accepted => AppColors.success,
    InvitationStatus.declined => AppColors.destructive,
    InvitationStatus.cancelled => AppColors.mutedForeground,
    InvitationStatus.expired => AppColors.mutedForeground,
  };
}
