import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../domain/entities/investor_profile_entity.dart';
import '../../domain/usecases/investor_profile_usecases.dart';

part 'investor_profile_event.dart';
part 'investor_profile_state.dart';

class InvestorProfileBloc extends Bloc<InvestorProfileEvent, InvestorProfileState> {
  final GetInvestorProfileUseCase _get;
  final CreateInvestorProfileUseCase _create;
  final UpdateInvestorProfileUseCase _update;

  InvestorProfileBloc({
    required GetInvestorProfileUseCase get,
    required CreateInvestorProfileUseCase create,
    required UpdateInvestorProfileUseCase update,
  })  : _get = get,
        _create = create,
        _update = update,
        super(const InvestorProfileState.initial()) {
    on<InvestorProfileRequested>(_onGet);
    on<InvestorProfileCreateRequested>(_onCreate);
    on<InvestorProfileUpdateRequested>(_onUpdate);
  }

  Future<void> _onGet(InvestorProfileRequested event, Emitter<InvestorProfileState> emit) async {
    emit(state.copyWith(status: InvestorProfileStatus.loading, error: null));
    final result = await _get();
    result.fold(
      (f) => emit(state.copyWith(status: InvestorProfileStatus.error, error: f.message)),
      (p) => emit(state.copyWith(status: InvestorProfileStatus.loaded, profile: p)),
    );
  }

  Future<void> _onCreate(
    InvestorProfileCreateRequested event,
    Emitter<InvestorProfileState> emit,
  ) async {
    emit(state.copyWith(status: InvestorProfileStatus.loading, error: null));
    final result = await _create(event.payload);
    result.fold(
      (f) => emit(state.copyWith(status: InvestorProfileStatus.error, error: f.message)),
      (p) => emit(state.copyWith(status: InvestorProfileStatus.loaded, profile: p)),
    );
  }

  Future<void> _onUpdate(
    InvestorProfileUpdateRequested event,
    Emitter<InvestorProfileState> emit,
  ) async {
    emit(state.copyWith(status: InvestorProfileStatus.loading, error: null));
    final result = await _update(event.payload);
    result.fold(
      (f) => emit(state.copyWith(status: InvestorProfileStatus.error, error: f.message)),
      (p) => emit(state.copyWith(status: InvestorProfileStatus.loaded, profile: p)),
    );
  }
}

