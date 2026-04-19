part of 'feed_bloc.dart';

enum FeedStatus { initial, loading, loaded, pitchLoaded, error }

class FeedState extends Equatable {
  final FeedStatus status;
  final List<SubmissionEntity> items;
  final SubmissionEntity? pitch;
  final String? error;

  const FeedState({
    required this.status,
    this.items = const [],
    this.pitch,
    this.error,
  });

  const FeedState.initial()
      : status = FeedStatus.initial,
        items = const [],
        pitch = null,
        error = null;

  FeedState copyWith({
    FeedStatus? status,
    List<SubmissionEntity>? items,
    SubmissionEntity? pitch,
    String? error,
  }) {
    return FeedState(
      status: status ?? this.status,
      items: items ?? this.items,
      pitch: pitch ?? this.pitch,
      error: error,
    );
  }

  bool get isLoading => status == FeedStatus.loading;

  @override
  List<Object?> get props => [status, items, pitch, error];
}

