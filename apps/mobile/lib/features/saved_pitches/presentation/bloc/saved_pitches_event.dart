part of 'saved_pitches_bloc.dart';

abstract class SavedPitchesEvent extends Equatable {
  const SavedPitchesEvent();
  @override
  List<Object?> get props => [];
}

class SavedPitchesRequested extends SavedPitchesEvent {
  const SavedPitchesRequested();
}

class SavedPitchToggled extends SavedPitchesEvent {
  final String pitchId;
  const SavedPitchToggled(this.pitchId);
  @override
  List<Object?> get props => [pitchId];
}

