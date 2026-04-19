import 'package:equatable/equatable.dart';

class FeedbackEntity extends Equatable {
  final Map<String, dynamic> data;
  const FeedbackEntity({required this.data});

  String get id => (data['_id'] as String?) ?? (data['id'] as String?) ?? '';
  String get toUserId => (data['toUserId'] as String?) ?? '';
  num? get rating => data['rating'] as num?;
  String get category => (data['category'] as String?) ?? '';
  String get comment => (data['comment'] as String?) ?? '';

  @override
  List<Object?> get props => [data];
}

