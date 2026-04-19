import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../submissions/domain/entities/submission_entity.dart';
import '../../domain/usecases/saved_pitches_usecases.dart';

part 'saved_pitches_event.dart';
part 'saved_pitches_state.dart';

class SavedPitchesBloc extends Bloc<SavedPitchesEvent, SavedPitchesState> {
  final ListSavedPitchesUseCase _list;
  final ToggleSavedPitchUseCase _toggle;

  SavedPitchesBloc({required ListSavedPitchesUseCase list, required ToggleSavedPitchUseCase toggle})
      : _list = list,
        _toggle = toggle,
        super(const SavedPitchesState.initial()) {
    on<SavedPitchesRequested>(_onList);
    on<SavedPitchToggled>(_onToggle);
  }

  Future<void> _onList(SavedPitchesRequested event, Emitter<SavedPitchesState> emit) async {
    emit(state.copyWith(status: SavedPitchesStatus.loading, error: null));
    final result = await _list();
    result.fold(
      (f) => emit(state.copyWith(status: SavedPitchesStatus.error, error: f.message)),
      (items) => emit(state.copyWith(status: SavedPitchesStatus.loaded, items: items)),
    );
  }

  Future<void> _onToggle(SavedPitchToggled event, Emitter<SavedPitchesState> emit) async {
    emit(state.copyWith(status: SavedPitchesStatus.loading, error: null));
    final result = await _toggle(event.pitchId);
    result.fold(
      (f) => emit(state.copyWith(status: SavedPitchesStatus.error, error: f.message)),
      (_) => add(const SavedPitchesRequested()),
    );
  }
}

