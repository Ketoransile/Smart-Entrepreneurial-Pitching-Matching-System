part of 'milestones_bloc.dart';

abstract class MilestonesEvent extends Equatable {
  const MilestonesEvent();
  @override
  List<Object?> get props => [];
}

class MilestonesRequested extends MilestonesEvent {
  final String? submissionId;
  final String? matchResultId;
  final String? status;
  const MilestonesRequested({this.submissionId, this.matchResultId, this.status});
  @override
  List<Object?> get props => [submissionId, matchResultId, status];
}

class MilestoneCreated extends MilestonesEvent {
  final Map<String, dynamic> payload;
  const MilestoneCreated(this.payload);
  @override
  List<Object?> get props => [payload];
}

class MilestoneUpdated extends MilestonesEvent {
  final String id;
  final Map<String, dynamic> payload;
  const MilestoneUpdated({required this.id, required this.payload});
  @override
  List<Object?> get props => [id, payload];
}

class MilestoneEvidenceSubmitted extends MilestonesEvent {
  final String id;
  final Map<String, dynamic> payload;
  const MilestoneEvidenceSubmitted({required this.id, required this.payload});
  @override
  List<Object?> get props => [id, payload];
}

class MilestoneVerified extends MilestonesEvent {
  final String id;
  final Map<String, dynamic> payload; // { approved: bool, notes?: string }
  const MilestoneVerified({required this.id, required this.payload});
  @override
  List<Object?> get props => [id, payload];
}

