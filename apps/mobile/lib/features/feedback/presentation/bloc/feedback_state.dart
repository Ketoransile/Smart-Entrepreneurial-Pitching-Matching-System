part of 'feedback_bloc.dart';

enum FeedbackStatus { initial, loading, loaded, summaryLoaded, submitted, error }

class FeedbackState extends Equatable {
  final FeedbackStatus status;
  final List<FeedbackEntity> received;
  final List<FeedbackEntity> given;
  final Map<String, dynamic>? summary;
  final String? error;

  const FeedbackState({
    required this.status,
    this.received = const [],
    this.given = const [],
    this.summary,
    this.error,
  });

  const FeedbackState.initial()
      : status = FeedbackStatus.initial,
        received = const [],
        given = const [],
        summary = null,
        error = null;

  FeedbackState copyWith({
    FeedbackStatus? status,
    List<FeedbackEntity>? received,
    List<FeedbackEntity>? given,
    Map<String, dynamic>? summary,
    String? error,
  }) {
    return FeedbackState(
      status: status ?? this.status,
      received: received ?? this.received,
      given: given ?? this.given,
      summary: summary ?? this.summary,
      error: error,
    );
  }

  bool get isLoading => status == FeedbackStatus.loading;

  @override
  List<Object?> get props => [status, received, given, summary, error];
}

