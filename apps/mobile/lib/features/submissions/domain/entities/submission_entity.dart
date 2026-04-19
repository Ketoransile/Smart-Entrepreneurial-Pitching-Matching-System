import 'package:equatable/equatable.dart';

class SubmissionEntity extends Equatable {
  final Map<String, dynamic> data;
  const SubmissionEntity({required this.data});

  String get id => (data['_id'] as String?) ?? (data['id'] as String?) ?? '';
  String get title => (data['title'] as String?) ?? '';
  String get status => (data['status'] as String?) ?? '';
  String get sector => (data['sector'] as String?) ?? '';
  String get stage => (data['stage'] as String?) ?? '';
  num? get targetAmount => data['targetAmount'] as num?;
  int? get currentStep => data['currentStep'] as int?;

  @override
  List<Object?> get props => [data];
}

