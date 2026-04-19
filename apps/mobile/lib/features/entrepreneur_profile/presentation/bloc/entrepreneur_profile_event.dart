part of 'entrepreneur_profile_bloc.dart';

abstract class EntrepreneurProfileEvent extends Equatable {
  const EntrepreneurProfileEvent();
  @override
  List<Object?> get props => [];
}

class EntrepreneurProfileChecked extends EntrepreneurProfileEvent {
  const EntrepreneurProfileChecked();
}

class EntrepreneurProfileLoaded extends EntrepreneurProfileEvent {
  const EntrepreneurProfileLoaded();
}

class EntrepreneurProfileCreateRequested extends EntrepreneurProfileEvent {
  final String fullName;
  final String companyName;
  final String companyRegistrationNumber;
  final String businessSector;
  final String businessStage;

  const EntrepreneurProfileCreateRequested({
    required this.fullName,
    required this.companyName,
    required this.companyRegistrationNumber,
    required this.businessSector,
    required this.businessStage,
  });

  @override
  List<Object?> get props =>
      [fullName, companyName, companyRegistrationNumber, businessSector, businessStage];
}

class EntrepreneurProfileUpdateRequested extends EntrepreneurProfileEvent {
  final Map<String, dynamic> patch;
  const EntrepreneurProfileUpdateRequested(this.patch);

  @override
  List<Object?> get props => [patch];
}

