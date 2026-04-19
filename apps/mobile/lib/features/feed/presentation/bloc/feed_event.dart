part of 'feed_bloc.dart';

abstract class FeedEvent extends Equatable {
  const FeedEvent();
  @override
  List<Object?> get props => [];
}

class FeedRequested extends FeedEvent {
  final String? sector;
  final String? sort;
  final int? page;
  final int? limit;
  const FeedRequested({this.sector, this.sort, this.page, this.limit});

  @override
  List<Object?> get props => [sector, sort, page, limit];
}

class PitchRequested extends FeedEvent {
  final String id;
  const PitchRequested(this.id);
  @override
  List<Object?> get props => [id];
}

