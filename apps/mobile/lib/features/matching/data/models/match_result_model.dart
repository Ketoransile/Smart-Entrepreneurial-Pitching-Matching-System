import '../../domain/entities/match_result_entity.dart';

class MatchResultModel extends MatchResultEntity {
  const MatchResultModel({required super.data});

  factory MatchResultModel.fromJson(Map<String, dynamic> json) {
    return MatchResultModel(data: json);
  }
}

