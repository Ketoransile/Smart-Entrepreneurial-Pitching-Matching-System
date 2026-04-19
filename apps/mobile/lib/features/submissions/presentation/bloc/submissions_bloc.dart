import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../domain/entities/submission_entity.dart';
import '../../domain/usecases/submissions_usecases.dart';

part 'submissions_event.dart';
part 'submissions_state.dart';

class SubmissionsBloc extends Bloc<SubmissionsEvent, SubmissionsState> {
  final ListMySubmissionsUseCase _list;
  final CreateDraftUseCase _create;
  final UpdateDraftUseCase _update;
  final DeleteDraftUseCase _delete;
  final SubmitPitchUseCase _submit;
  final CompletenessUseCase _completeness;

  SubmissionsBloc({
    required ListMySubmissionsUseCase list,
    required CreateDraftUseCase create,
    required UpdateDraftUseCase update,
    required DeleteDraftUseCase delete,
    required SubmitPitchUseCase submit,
    required CompletenessUseCase completeness,
  })  : _list = list,
        _create = create,
        _update = update,
        _delete = delete,
        _submit = submit,
        _completeness = completeness,
        super(const SubmissionsState.initial()) {
    on<MySubmissionsRequested>(_onList);
    on<SubmissionDraftCreated>(_onCreate);
    on<SubmissionDraftUpdated>(_onUpdate);
    on<SubmissionDraftDeleted>(_onDelete);
    on<SubmissionSubmitted>(_onSubmit);
    on<SubmissionCompletenessRequested>(_onCompleteness);
  }

  Future<void> _onList(MySubmissionsRequested event, Emitter<SubmissionsState> emit) async {
    emit(state.copyWith(status: SubmissionsStatus.loading, error: null));
    final result = await _list();
    result.fold(
      (f) => emit(state.copyWith(status: SubmissionsStatus.error, error: f.message)),
      (list) => emit(state.copyWith(status: SubmissionsStatus.loaded, items: list)),
    );
  }

  Future<void> _onCreate(SubmissionDraftCreated event, Emitter<SubmissionsState> emit) async {
    emit(state.copyWith(status: SubmissionsStatus.loading, error: null));
    final result = await _create(title: event.title, sector: event.sector, stage: event.stage);
    result.fold(
      (f) => emit(state.copyWith(status: SubmissionsStatus.error, error: f.message)),
      (_) => add(const MySubmissionsRequested()),
    );
  }

  Future<void> _onUpdate(SubmissionDraftUpdated event, Emitter<SubmissionsState> emit) async {
    emit(state.copyWith(status: SubmissionsStatus.loading, error: null));
    final result = await _update(event.id, event.patch);
    result.fold(
      (f) => emit(state.copyWith(status: SubmissionsStatus.error, error: f.message)),
      (_) => add(const MySubmissionsRequested()),
    );
  }

  Future<void> _onDelete(SubmissionDraftDeleted event, Emitter<SubmissionsState> emit) async {
    emit(state.copyWith(status: SubmissionsStatus.loading, error: null));
    final result = await _delete(event.id);
    result.fold(
      (f) => emit(state.copyWith(status: SubmissionsStatus.error, error: f.message)),
      (_) => add(const MySubmissionsRequested()),
    );
  }

  Future<void> _onSubmit(SubmissionSubmitted event, Emitter<SubmissionsState> emit) async {
    emit(state.copyWith(status: SubmissionsStatus.loading, error: null));
    final result = await _submit(event.id);
    result.fold(
      (f) => emit(state.copyWith(status: SubmissionsStatus.error, error: f.message)),
      (_) => add(const MySubmissionsRequested()),
    );
  }

  Future<void> _onCompleteness(
    SubmissionCompletenessRequested event,
    Emitter<SubmissionsState> emit,
  ) async {
    emit(state.copyWith(status: SubmissionsStatus.loading, error: null));
    final result = await _completeness(event.id);
    result.fold(
      (f) => emit(state.copyWith(status: SubmissionsStatus.error, error: f.message)),
      (data) => emit(state.copyWith(
        status: SubmissionsStatus.completenessLoaded,
        completeness: data,
      )),
    );
  }
}

