import 'package:equatable/equatable.dart';

class InvitationEntity extends Equatable {
  final Map<String, dynamic> data;
  const InvitationEntity({required this.data});

  String get id => (data['_id'] as String?) ?? (data['id'] as String?) ?? '';
  String get status => (data['status'] as String?) ?? '';
  String get message => (data['message'] as String?) ?? '';

  @override
  List<Object?> get props => [data];
}

