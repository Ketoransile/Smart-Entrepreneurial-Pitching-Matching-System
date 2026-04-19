import 'package:equatable/equatable.dart';

class EntrepreneurProfileEntity extends Equatable {
  final Map<String, dynamic> data;
  const EntrepreneurProfileEntity({required this.data});

  String get fullName => (data['fullName'] as String?) ?? '';
  String get companyName => (data['companyName'] as String?) ?? '';
  String get businessSector => (data['businessSector'] as String?) ?? '';
  String get businessStage => (data['businessStage'] as String?) ?? '';

  @override
  List<Object?> get props => [data];
}

