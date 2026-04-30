import 'package:dio/dio.dart';

import '../../../../core/config/api_config.dart';
import '../../../../core/config/urls.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/mock/mock_backend.dart';
import '../../../../core/network/dio_client.dart';
import '../models/match_result_model.dart';

abstract class MatchingRemoteDataSource {
  Future<void> runMatching(String submissionId, {int? limit, double? minScore});
  Future<List<MatchResultModel>> getResults(String submissionId);
}

class MatchingRemoteDataSourceImpl implements MatchingRemoteDataSource {
  final DioClient _dio;
  MatchingRemoteDataSourceImpl({required DioClient dioClient})
      : _dio = dioClient;

  @override
  Future<void> runMatching(String submissionId,
      {int? limit, double? minScore}) async {
    if (ApiConfig.useMockData) {
      await Future<void>.delayed(ApiConfig.mockLatency);
      MockBackend.runMatching(submissionId);
      return;
    }
    try {
      final res = await _dio.post(
        Urls.buildUrl(Urls.createMatch, submissionId),
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
    if (ApiConfig.useMockData) {
      await Future<void>.delayed(ApiConfig.mockLatency);
      return MockBackend.matchResults(submissionId);
    }
    try {
      final res = await _dio.get(Urls.buildUrl(Urls.getMatch, submissionId));
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
