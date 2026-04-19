import 'package:equatable/equatable.dart';

class DocumentEntity extends Equatable {
  final Map<String, dynamic> data;
  const DocumentEntity({required this.data});

  String get id => (data['_id'] as String?) ?? (data['id'] as String?) ?? '';
  String get type => (data['type'] as String?) ?? '';
  String get filename =>
      (data['filename'] as String?) ?? (data['originalName'] as String?) ?? '';
  String get url => (data['url'] as String?) ?? (data['secureUrl'] as String?) ?? '';
  String get status => (data['status'] as String?) ?? '';

  @override
  List<Object?> get props => [data];
}

