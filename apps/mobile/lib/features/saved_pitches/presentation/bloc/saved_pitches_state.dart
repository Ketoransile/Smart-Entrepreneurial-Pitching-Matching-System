part of 'saved_pitches_bloc.dart';

enum SavedPitchesStatus { initial, loading, loaded, error }

class SavedPitchesState extends Equatable {
  final SavedPitchesStatus status;
  final List<SubmissionEntity> items;
  final String? error;

  const SavedPitchesState({
    required this.status,
    this.items = const [],
    this.error,
  });

  const SavedPitchesState.initial()
      : status = SavedPitchesStatus.initial,
        items = const [],
        error = null;

  SavedPitchesState copyWith({
    SavedPitchesStatus? status,
    List<SubmissionEntity>? items,
    String? error,
  }) {
    return SavedPitchesState(
      status: status ?? this.status,
      items: items ?? this.items,
      error: error,
    );
  }

  bool get isLoading => status == SavedPitchesStatus.loading;

  @override
  List<Object?> get props => [status, items, error];
}

