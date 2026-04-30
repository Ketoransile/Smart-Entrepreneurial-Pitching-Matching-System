import '../domain/entities/submission_entity.dart';

/// Human-readable stage for investor-facing lists.
String submissionStageLabel(SubmissionStage stage) {
  switch (stage) {
    case SubmissionStage.mvp:
      return 'MVP';
    case SubmissionStage.earlyRevenue:
      return 'Early revenue';
    case SubmissionStage.scaling:
      return 'Scaling';
  }
}

/// Human-readable submission pipeline status for founder lists.
String submissionStatusLabel(SubmissionStatus status) {
  return switch (status) {
    SubmissionStatus.draft => 'Draft',
    SubmissionStatus.submitted => 'Submitted',
    SubmissionStatus.underReview => 'Under review',
    SubmissionStatus.approved => 'Approved',
    SubmissionStatus.rejected => 'Rejected',
    SubmissionStatus.suspended => 'Suspended',
    SubmissionStatus.matched => 'Matched',
    SubmissionStatus.closed => 'Closed',
  };
}
