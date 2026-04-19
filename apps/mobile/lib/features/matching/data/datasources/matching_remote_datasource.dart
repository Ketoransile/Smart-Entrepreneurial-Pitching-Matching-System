import 'package:dio/dio.dart';

import '../../../../core/config/api_config.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/network/dio_client.dart';
import '../models/match_result_model.dart';

abstract class MatchingRemoteDataSource {
  Future<void> runMatching(String submissionId, {int? limit, double? minScore});
  Future<List<MatchResultModel>> getResults(String submissionId);
}

class MatchingRemoteDataSourceImpl implements MatchingRemoteDataSource {
  final DioClient _dio;
  MatchingRemoteDataSourceImpl({required DioClient dioClient}) : _dio = dioClient;

  @override
  Future<void> runMatching(String submissionId, {int? limit, double? minScore}) async {
    try {
      final res = await _dio.post(
        ApiConfig.matchingRun(submissionId),
        data: {
          if (limit != null) 'limit': limit,
          if (minScore != null) 'minScore': minScore,
        },
      );
      if (res.statusCode == 200) return;
      throw ServerFailure(message: 'Failed (HTTP ${res.statusCode})');
    } on DioException catch (e) {
      throw ServerFailure(message: e.message ?? 'Failed to run matching');
    }
  }

  @override
  Future<List<MatchResultModel>> getResults(String submissionId) async {
    try {
      final res = await _dio.get(ApiConfig.matchingResults(submissionId));
      if (res.statusCode == 200) {
        final data = res.data as Map<String, dynamic>;
        final list = (data['matches'] as List?) ??
            (data['results'] as List?) ??
            (data['data'] as List?) ??
            const [];
        return list
            .whereType<Map>()
            .map((e) => MatchResultModel.fromJson(e.cast<String, dynamic>()))
            .toList();
      }
      throw ServerFailure(message: 'Failed (HTTP ${res.statusCode})');
    } on DioException catch (e) {
      throw ServerFailure(message: e.message ?? 'Failed to load match results');
    }
  }
}

