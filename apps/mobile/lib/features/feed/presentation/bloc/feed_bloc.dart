import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../submissions/domain/entities/submission_entity.dart';
import '../../domain/usecases/feed_usecases.dart';

part 'feed_event.dart';
part 'feed_state.dart';

class FeedBloc extends Bloc<FeedEvent, FeedState> {
  final BrowseFeedUseCase _browse;
  final GetPitchUseCase _getPitch;

  FeedBloc({required BrowseFeedUseCase browse, required GetPitchUseCase getPitch})
      : _browse = browse,
        _getPitch = getPitch,
        super(const FeedState.initial()) {
    on<FeedRequested>(_onRequested);
    on<PitchRequested>(_onPitch);
  }

  Future<void> _onRequested(FeedRequested event, Emitter<FeedState> emit) async {
    emit(state.copyWith(status: FeedStatus.loading, error: null));
    final result = await _browse(
      sector: event.sector,
      sort: event.sort,
      page: event.page,
      limit: event.limit,
    );
    result.fold(
      (f) => emit(state.copyWith(status: FeedStatus.error, error: f.message)),
      (items) => emit(state.copyWith(status: FeedStatus.loaded, items: items)),
    );
  }

  Future<void> _onPitch(PitchRequested event, Emitter<FeedState> emit) async {
    emit(state.copyWith(status: FeedStatus.loading, error: null));
    final result = await _getPitch(event.id);
    result.fold(
      (f) => emit(state.copyWith(status: FeedStatus.error, error: f.message)),
      (pitch) => emit(state.copyWith(status: FeedStatus.pitchLoaded, pitch: pitch)),
    );
  }
}

