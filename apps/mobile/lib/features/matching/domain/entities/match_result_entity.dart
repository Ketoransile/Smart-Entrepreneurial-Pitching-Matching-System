import 'package:equatable/equatable.dart';

class MatchResultEntity extends Equatable {
  final Map<String, dynamic> data;
  const MatchResultEntity({required this.data});

  String get id => (data['_id'] as String?) ?? (data['id'] as String?) ?? '';
  String get status => (data['status'] as String?) ?? '';
  double? get score {
    final v = data['score'];
    if (v is num) return v.toDouble();
    return null;
  }

  String get investorName =>
      (data['investorName'] as String?) ??
      (data['investor'] is Map ? (data['investor']['fullName'] as String?) : null) ??
      '';

  String get investorId =>
      (data['investorId'] as String?) ??
      (data['investor'] is Map ? (data['investor']['userId'] as String?) : null) ??
      '';

  @override
  List<Object?> get props => [data];
}

