part of 'matching_bloc.dart';

abstract class MatchingEvent extends Equatable {
  const MatchingEvent();
  @override
  List<Object?> get props => [];
}

class MatchingRunRequested extends MatchingEvent {
  final String submissionId;
  final int? limit;
  final double? minScore;
  const MatchingRunRequested(this.submissionId, {this.limit, this.minScore});

  @override
  List<Object?> get props => [submissionId, limit, minScore];
}

class MatchingResultsRequested extends MatchingEvent {
  final String submissionId;
  const MatchingResultsRequested(this.submissionId);

  @override
  List<Object?> get props => [submissionId];
}

