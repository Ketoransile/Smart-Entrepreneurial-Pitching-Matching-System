import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../domain/entities/feedback_entity.dart';
import '../../domain/usecases/feedback_usecases.dart';

part 'feedback_event.dart';
part 'feedback_state.dart';

class FeedbackBloc extends Bloc<FeedbackEvent, FeedbackState> {
  final SubmitFeedbackUseCase _submit;
  final ListReceivedFeedbackUseCase _received;
  final ListGivenFeedbackUseCase _given;
  final FeedbackSummaryUseCase _summary;

  FeedbackBloc({
    required SubmitFeedbackUseCase submit,
    required ListReceivedFeedbackUseCase received,
    required ListGivenFeedbackUseCase given,
    required FeedbackSummaryUseCase summary,
  })  : _submit = submit,
        _received = received,
        _given = given,
        _summary = summary,
        super(const FeedbackState.initial()) {
    on<FeedbackReceivedRequested>(_onReceived);
    on<FeedbackGivenRequested>(_onGiven);
    on<FeedbackSummaryRequested>(_onSummary);
    on<FeedbackSubmitRequested>(_onSubmit);
  }

  Future<void> _onReceived(
    FeedbackReceivedRequested event,
    Emitter<FeedbackState> emit,
  ) async {
    emit(state.copyWith(status: FeedbackStatus.loading, error: null));
    final result = await _received();
    result.fold(
      (f) => emit(state.copyWith(status: FeedbackStatus.error, error: f.message)),
      (items) => emit(state.copyWith(status: FeedbackStatus.loaded, received: items)),
    );
  }

  Future<void> _onGiven(FeedbackGivenRequested event, Emitter<FeedbackState> emit) async {
    emit(state.copyWith(status: FeedbackStatus.loading, error: null));
    final result = await _given();
    result.fold(
      (f) => emit(state.copyWith(status: FeedbackStatus.error, error: f.message)),
      (items) => emit(state.copyWith(status: FeedbackStatus.loaded, given: items)),
    );
  }

  Future<void> _onSummary(FeedbackSummaryRequested event, Emitter<FeedbackState> emit) async {
    emit(state.copyWith(status: FeedbackStatus.loading, error: null));
    final result = await _summary();
    result.fold(
      (f) => emit(state.copyWith(status: FeedbackStatus.error, error: f.message)),
      (s) => emit(state.copyWith(status: FeedbackStatus.summaryLoaded, summary: s)),
    );
  }

  Future<void> _onSubmit(FeedbackSubmitRequested event, Emitter<FeedbackState> emit) async {
    emit(state.copyWith(status: FeedbackStatus.loading, error: null));
    final result = await _submit(event.payload);
    result.fold(
      (f) => emit(state.copyWith(status: FeedbackStatus.error, error: f.message)),
      (_) => emit(state.copyWith(status: FeedbackStatus.submitted)),
    );
  }
}

