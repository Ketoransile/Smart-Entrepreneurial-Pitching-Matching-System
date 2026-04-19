part of 'submissions_bloc.dart';

abstract class SubmissionsEvent extends Equatable {
  const SubmissionsEvent();
  @override
  List<Object?> get props => [];
}

class MySubmissionsRequested extends SubmissionsEvent {
  const MySubmissionsRequested();
}

class SubmissionDraftCreated extends SubmissionsEvent {
  final String? title;
  final String? sector;
  final String? stage;
  const SubmissionDraftCreated({this.title, this.sector, this.stage});
  @override
  List<Object?> get props => [title, sector, stage];
}

class SubmissionDraftUpdated extends SubmissionsEvent {
  final String id;
  final Map<String, dynamic> patch;
  const SubmissionDraftUpdated({required this.id, required this.patch});
  @override
  List<Object?> get props => [id, patch];
}

class SubmissionDraftDeleted extends SubmissionsEvent {
  final String id;
  const SubmissionDraftDeleted(this.id);
  @override
  List<Object?> get props => [id];
}

class SubmissionSubmitted extends SubmissionsEvent {
  final String id;
  const SubmissionSubmitted(this.id);
  @override
  List<Object?> get props => [id];
}

class SubmissionCompletenessRequested extends SubmissionsEvent {
  final String id;
  const SubmissionCompletenessRequested(this.id);
  @override
  List<Object?> get props => [id];
}

