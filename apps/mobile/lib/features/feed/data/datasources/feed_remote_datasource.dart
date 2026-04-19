import 'package:dio/dio.dart';

import '../../../../core/config/api_config.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/network/dio_client.dart';
import '../../../submissions/data/models/submission_model.dart';

abstract class FeedRemoteDataSource {
  Future<List<SubmissionModel>> browse({
    String? sector,
    String? sort,
    int? page,
    int? limit,
  });
  Future<SubmissionModel> getPitch(String id);
}

class FeedRemoteDataSourceImpl implements FeedRemoteDataSource {
  final DioClient _dio;
  FeedRemoteDataSourceImpl({required DioClient dioClient}) : _dio = dioClient;

  @override
  Future<List<SubmissionModel>> browse({
    String? sector,
    String? sort,
    int? page,
    int? limit,
  }) async {
    try {
      final res = await _dio.get(
        ApiConfig.submissionsFeedBrowse,
        queryParameters: {
          if (sector != null && sector.isNotEmpty) 'sector': sector,
          if (sort != null && sort.isNotEmpty) 'sort': sort,
          if (page != null) 'page': page,
          if (limit != null) 'limit': limit,
        },
      );
      if (res.statusCode == 200) {
        final data = res.data as Map<String, dynamic>;
        final list = (data['submissions'] as List?) ??
            (data['items'] as List?) ??
            (data['data'] as List?) ??
            const [];
        return list
            .whereType<Map>()
            .map((e) => SubmissionModel.fromJson(e.cast<String, dynamic>()))
            .toList();
      }
      throw ServerFailure(message: 'Failed (HTTP ${res.statusCode})');
    } on DioException catch (e) {
      throw ServerFailure(message: e.message ?? 'Failed to load feed');
    }
  }

  @override
  Future<SubmissionModel> getPitch(String id) async {
    try {
      final res = await _dio.get(ApiConfig.submissionById(id));
      if (res.statusCode == 200) {
        final data = res.data as Map<String, dynamic>;
        final s = (data['submission'] as Map?)?.cast<String, dynamic>() ?? data;
        return SubmissionModel.fromJson(s);
      }
      throw ServerFailure(message: 'Failed (HTTP ${res.statusCode})');
    } on DioException catch (e) {
      throw ServerFailure(message: e.message ?? 'Failed to load pitch');
    }
  }
}

