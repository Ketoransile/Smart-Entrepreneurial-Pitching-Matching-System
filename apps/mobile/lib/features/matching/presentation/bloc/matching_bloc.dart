import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../domain/entities/match_result_entity.dart';
import '../../domain/usecases/matching_usecases.dart';

part 'matching_event.dart';
part 'matching_state.dart';

class MatchingBloc extends Bloc<MatchingEvent, MatchingState> {
  final RunMatchingUseCase _run;
  final GetMatchResultsUseCase _getResults;

  MatchingBloc({required RunMatchingUseCase run, required GetMatchResultsUseCase getResults})
      : _run = run,
        _getResults = getResults,
        super(const MatchingState.initial()) {
    on<MatchingRunRequested>(_onRun);
    on<MatchingResultsRequested>(_onResults);
  }

  Future<void> _onRun(MatchingRunRequested event, Emitter<MatchingState> emit) async {
    emit(state.copyWith(status: MatchingStatus.loading, error: null));
    final result = await _run(event.submissionId, limit: event.limit, minScore: event.minScore);
    result.fold(
      (f) => emit(state.copyWith(status: MatchingStatus.error, error: f.message)),
      (_) => add(MatchingResultsRequested(event.submissionId)),
    );
  }

  Future<void> _onResults(
    MatchingResultsRequested event,
    Emitter<MatchingState> emit,
  ) async {
    emit(state.copyWith(status: MatchingStatus.loading, error: null));
    final result = await _getResults(event.submissionId);
    result.fold(
      (f) => emit(state.copyWith(status: MatchingStatus.error, error: f.message)),
      (items) => emit(state.copyWith(status: MatchingStatus.loaded, results: items)),
    );
  }
}

