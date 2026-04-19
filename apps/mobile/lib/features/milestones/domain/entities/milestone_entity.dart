import 'package:equatable/equatable.dart';

class MilestoneEntity extends Equatable {
  final Map<String, dynamic> data;
  const MilestoneEntity({required this.data});

  String get id => (data['_id'] as String?) ?? (data['id'] as String?) ?? '';
  String get title => (data['title'] as String?) ?? '';
  String get status => (data['status'] as String?) ?? '';
  num? get amount => data['amount'] as num?;
  String get currency => (data['currency'] as String?) ?? 'USD';

  @override
  List<Object?> get props => [data];
}

