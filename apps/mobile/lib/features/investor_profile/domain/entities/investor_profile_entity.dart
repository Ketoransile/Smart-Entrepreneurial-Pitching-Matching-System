import 'package:equatable/equatable.dart';

class InvestorProfileEntity extends Equatable {
  final Map<String, dynamic> data;
  const InvestorProfileEntity({required this.data});

  String get fullName => (data['fullName'] as String?) ?? '';
  List<String> get preferredSectors =>
      (data['preferredSectors'] as List?)?.whereType<String>().toList() ?? const [];
  List<String> get preferredStages =>
      (data['preferredStages'] as List?)?.whereType<String>().toList() ?? const [];

  @override
  List<Object?> get props => [data];
}

