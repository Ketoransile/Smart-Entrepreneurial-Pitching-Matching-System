part of 'match_queue_bloc.dart';

abstract class MatchQueueEvent extends Equatable {
  const MatchQueueEvent();
  @override
  List<Object?> get props => [];
}

class MatchQueueRequested extends MatchQueueEvent {
  final String? statusFilter;
  const MatchQueueRequested({this.statusFilter});
  @override
  List<Object?> get props => [statusFilter];
}

class MatchStatusChanged extends MatchQueueEvent {
  final String matchId;
  final String newStatus; // accepted | declined
  const MatchStatusChanged({required this.matchId, required this.newStatus});
  @override
  List<Object?> get props => [matchId, newStatus];
}

