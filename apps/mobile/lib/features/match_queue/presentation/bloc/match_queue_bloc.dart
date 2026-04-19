import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../matching/domain/entities/match_result_entity.dart';
import '../../domain/usecases/match_queue_usecases.dart';

part 'match_queue_event.dart';
part 'match_queue_state.dart';

class MatchQueueBloc extends Bloc<MatchQueueEvent, MatchQueueState> {
  final ListMatchQueueUseCase _list;
  final UpdateMatchStatusUseCase _update;

  MatchQueueBloc({required ListMatchQueueUseCase list, required UpdateMatchStatusUseCase update})
      : _list = list,
        _update = update,
        super(const MatchQueueState.initial()) {
    on<MatchQueueRequested>(_onList);
    on<MatchStatusChanged>(_onChange);
  }

  Future<void> _onList(MatchQueueRequested event, Emitter<MatchQueueState> emit) async {
    emit(state.copyWith(status: MatchQueueStatus.loading, error: null));
    final result = await _list(status: event.statusFilter);
    result.fold(
      (f) => emit(state.copyWith(status: MatchQueueStatus.error, error: f.message)),
      (items) => emit(state.copyWith(status: MatchQueueStatus.loaded, items: items)),
    );
  }

  Future<void> _onChange(MatchStatusChanged event, Emitter<MatchQueueState> emit) async {
    emit(state.copyWith(status: MatchQueueStatus.loading, error: null));
    final result = await _update(event.matchId, event.newStatus);
    result.fold(
      (f) => emit(state.copyWith(status: MatchQueueStatus.error, error: f.message)),
      (_) => add(MatchQueueRequested(statusFilter: state.statusFilter)),
    );
  }
}

