import 'package:flutter_bloc/flutter_bloc.dart';

import '../../domain/usecases/get_my_profile_usecase.dart';
import 'user_profile_event.dart';
import 'user_profile_state.dart';

class UserProfileBloc extends Bloc<UserProfileEvent, UserProfileState> {
  final GetMyProfileUseCase _getMyProfile;

  UserProfileBloc({required GetMyProfileUseCase getMyProfile})
      : _getMyProfile = getMyProfile,
        super(const UserProfileState.initial()) {
    on<UserProfileRequested>(_onRequested);
  }

  Future<void> _onRequested(
    UserProfileRequested event,
    Emitter<UserProfileState> emit,
  ) async {
    emit(state.copyWith(status: UserProfileStatus.loading, errorMessage: null));

    final result = await _getMyProfile();
    result.fold(
      (failure) => emit(state.copyWith(
        status: UserProfileStatus.error,
        errorMessage: failure.message,
      )),
      (profile) => emit(state.copyWith(
        status: UserProfileStatus.loaded,
        profile: profile,
        errorMessage: null,
      )),
    );
  }
}

