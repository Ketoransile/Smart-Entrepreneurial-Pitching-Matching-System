part of 'investor_profile_bloc.dart';

abstract class InvestorProfileEvent extends Equatable {
  const InvestorProfileEvent();
  @override
  List<Object?> get props => [];
}

class InvestorProfileRequested extends InvestorProfileEvent {
  const InvestorProfileRequested();
}

class InvestorProfileCreateRequested extends InvestorProfileEvent {
  final Map<String, dynamic> payload;
  const InvestorProfileCreateRequested(this.payload);
  @override
  List<Object?> get props => [payload];
}

class InvestorProfileUpdateRequested extends InvestorProfileEvent {
  final Map<String, dynamic> payload;
  const InvestorProfileUpdateRequested(this.payload);
  @override
  List<Object?> get props => [payload];
}

