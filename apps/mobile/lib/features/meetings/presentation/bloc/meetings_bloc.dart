import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../domain/entities/meeting_entity.dart';
import '../../domain/usecases/meetings_usecases.dart';

part 'meetings_event.dart';
part 'meetings_state.dart';

class MeetingsBloc extends Bloc<MeetingsEvent, MeetingsState> {
  final ListMeetingsUseCase _list;
  final ScheduleMeetingUseCase _schedule;
  final UpdateMeetingStatusUseCase _update;

  MeetingsBloc({
    required ListMeetingsUseCase list,
    required ScheduleMeetingUseCase schedule,
    required UpdateMeetingStatusUseCase update,
  })  : _list = list,
        _schedule = schedule,
        _update = update,
        super(const MeetingsState.initial()) {
    on<MeetingsRequested>(_onList);
    on<MeetingScheduled>(_onSchedule);
    on<MeetingStatusUpdated>(_onUpdate);
  }

  Future<void> _onList(MeetingsRequested event, Emitter<MeetingsState> emit) async {
    emit(state.copyWith(status: MeetingsStatus.loading, error: null, statusFilter: event.status));
    final result = await _list(status: event.status);
    result.fold(
      (f) => emit(state.copyWith(status: MeetingsStatus.error, error: f.message)),
      (items) => emit(state.copyWith(status: MeetingsStatus.loaded, items: items)),
    );
  }

  Future<void> _onSchedule(MeetingScheduled event, Emitter<MeetingsState> emit) async {
    emit(state.copyWith(status: MeetingsStatus.loading, error: null));
    final result = await _schedule(event.payload);
    result.fold(
      (f) => emit(state.copyWith(status: MeetingsStatus.error, error: f.message)),
      (_) => add(MeetingsRequested(status: state.statusFilter)),
    );
  }

  Future<void> _onUpdate(MeetingStatusUpdated event, Emitter<MeetingsState> emit) async {
    emit(state.copyWith(status: MeetingsStatus.loading, error: null));
    final result = await _update(event.meetingId, event.payload);
    result.fold(
      (f) => emit(state.copyWith(status: MeetingsStatus.error, error: f.message)),
      (_) => add(MeetingsRequested(status: state.statusFilter)),
    );
  }
}

