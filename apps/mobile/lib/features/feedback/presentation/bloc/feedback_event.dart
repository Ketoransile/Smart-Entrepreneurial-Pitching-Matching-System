part of 'feedback_bloc.dart';

abstract class FeedbackEvent extends Equatable {
  const FeedbackEvent();
  @override
  List<Object?> get props => [];
}

class FeedbackReceivedRequested extends FeedbackEvent {
  const FeedbackReceivedRequested();
}

class FeedbackGivenRequested extends FeedbackEvent {
  const FeedbackGivenRequested();
}

class FeedbackSummaryRequested extends FeedbackEvent {
  const FeedbackSummaryRequested();
}

class FeedbackSubmitRequested extends FeedbackEvent {
  final Map<String, dynamic> payload;
  const FeedbackSubmitRequested(this.payload);
  @override
  List<Object?> get props => [payload];
}

