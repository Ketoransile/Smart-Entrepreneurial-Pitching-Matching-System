import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../domain/entities/milestone_entity.dart';
import '../../domain/usecases/milestones_usecases.dart';

part 'milestones_event.dart';
part 'milestones_state.dart';

class MilestonesBloc extends Bloc<MilestonesEvent, MilestonesState> {
  final ListMilestonesUseCase _list;
  final CreateMilestoneUseCase _create;
  final UpdateMilestoneUseCase _update;
  final SubmitMilestoneEvidenceUseCase _evidence;
  final VerifyMilestoneUseCase _verify;

  MilestonesBloc({
    required ListMilestonesUseCase list,
    required CreateMilestoneUseCase create,
    required UpdateMilestoneUseCase update,
    required SubmitMilestoneEvidenceUseCase evidence,
    required VerifyMilestoneUseCase verify,
  })  : _list = list,
        _create = create,
        _update = update,
        _evidence = evidence,
        _verify = verify,
        super(const MilestonesState.initial()) {
    on<MilestonesRequested>(_onList);
    on<MilestoneCreated>(_onCreate);
    on<MilestoneUpdated>(_onUpdate);
    on<MilestoneEvidenceSubmitted>(_onEvidence);
    on<MilestoneVerified>(_onVerify);
  }

  Future<void> _onList(MilestonesRequested event, Emitter<MilestonesState> emit) async {
    emit(state.copyWith(status: MilestonesStatus.loading, error: null));
    final result = await _list(
      submissionId: event.submissionId,
      matchResultId: event.matchResultId,
      status: event.status,
    );
    result.fold(
      (f) => emit(state.copyWith(status: MilestonesStatus.error, error: f.message)),
      (items) => emit(state.copyWith(status: MilestonesStatus.loaded, items: items)),
    );
  }

  Future<void> _onCreate(MilestoneCreated event, Emitter<MilestonesState> emit) async {
    emit(state.copyWith(status: MilestonesStatus.loading, error: null));
    final result = await _create(event.payload);
    result.fold(
      (f) => emit(state.copyWith(status: MilestonesStatus.error, error: f.message)),
      (_) => add(const MilestonesRequested()),
    );
  }

  Future<void> _onUpdate(MilestoneUpdated event, Emitter<MilestonesState> emit) async {
    emit(state.copyWith(status: MilestonesStatus.loading, error: null));
    final result = await _update(event.id, event.payload);
    result.fold(
      (f) => emit(state.copyWith(status: MilestonesStatus.error, error: f.message)),
      (_) => add(const MilestonesRequested()),
    );
  }

  Future<void> _onEvidence(
    MilestoneEvidenceSubmitted event,
    Emitter<MilestonesState> emit,
  ) async {
    emit(state.copyWith(status: MilestonesStatus.loading, error: null));
    final result = await _evidence(event.id, event.payload);
    result.fold(
      (f) => emit(state.copyWith(status: MilestonesStatus.error, error: f.message)),
      (_) => add(const MilestonesRequested()),
    );
  }

  Future<void> _onVerify(MilestoneVerified event, Emitter<MilestonesState> emit) async {
    emit(state.copyWith(status: MilestonesStatus.loading, error: null));
    final result = await _verify(event.id, event.payload);
    result.fold(
      (f) => emit(state.copyWith(status: MilestonesStatus.error, error: f.message)),
      (_) => add(const MilestonesRequested()),
    );
  }
}

