import '../domain/entities/milestone_entity.dart';

String milestoneStatusLabel(MilestoneStatus status) {
  return switch (status) {
    MilestoneStatus.pending => 'Pending',
    MilestoneStatus.inProgress => 'In progress',
    MilestoneStatus.submittedForReview => 'Submitted for review',
    MilestoneStatus.verifiedPaid => 'Verified / paid',
    MilestoneStatus.rejected => 'Rejected',
    MilestoneStatus.cancelled => 'Cancelled',
  };
}
