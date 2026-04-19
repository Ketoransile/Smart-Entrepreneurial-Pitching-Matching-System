import 'package:dio/dio.dart';

import '../../../../core/config/api_config.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/network/dio_client.dart';
import '../models/feedback_model.dart';

abstract class FeedbackRemoteDataSource {
  Future<FeedbackModel> submit(Map<String, dynamic> payload);
  Future<List<FeedbackModel>> listReceived();
  Future<List<FeedbackModel>> listGiven();
  Future<Map<String, dynamic>> summary();
}

class FeedbackRemoteDataSourceImpl implements FeedbackRemoteDataSource {
  final DioClient _dio;
  FeedbackRemoteDataSourceImpl({required DioClient dioClient}) : _dio = dioClient;

  @override
  Future<FeedbackModel> submit(Map<String, dynamic> payload) async {
    try {
      final res = await _dio.post(ApiConfig.feedback, data: payload);
      if (res.statusCode == 200 || res.statusCode == 201) {
        final data = res.data as Map<String, dynamic>;
        final fb = (data['feedback'] as Map?)?.cast<String, dynamic>() ?? data;
        return FeedbackModel.fromJson(fb);
      }
      throw const ServerFailure(message: 'Failed to submit feedback');
    } on DioException catch (e) {
      throw ServerFailure(message: e.message ?? 'Failed to submit feedback');
    }
  }

  @override
  Future<List<FeedbackModel>> listReceived() async {
    try {
      final res = await _dio.get(ApiConfig.feedbackReceived);
      if (res.statusCode == 200) {
        final data = res.data as Map<String, dynamic>;
        final list = (data['feedback'] as List?) ?? (data['data'] as List?) ?? const [];
        return list
            .whereType<Map>()
            .map((e) => FeedbackModel.fromJson(e.cast<String, dynamic>()))
            .toList();
      }
      throw ServerFailure(message: 'Failed (HTTP ${res.statusCode})');
    } on DioException catch (e) {
      throw ServerFailure(message: e.message ?? 'Failed to load feedback');
    }
  }

  @override
  Future<List<FeedbackModel>> listGiven() async {
    try {
      final res = await _dio.get(ApiConfig.feedbackGiven);
      if (res.statusCode == 200) {
        final data = res.data as Map<String, dynamic>;
        final list = (data['feedback'] as List?) ?? (data['data'] as List?) ?? const [];
        return list
            .whereType<Map>()
            .map((e) => FeedbackModel.fromJson(e.cast<String, dynamic>()))
            .toList();
      }
      throw ServerFailure(message: 'Failed (HTTP ${res.statusCode})');
    } on DioException catch (e) {
      throw ServerFailure(message: e.message ?? 'Failed to load feedback');
    }
  }

  @override
  Future<Map<String, dynamic>> summary() async {
    try {
      final res = await _dio.get(ApiConfig.feedbackSummary);
      if (res.statusCode == 200) {
        return (res.data as Map).cast<String, dynamic>();
      }
      throw ServerFailure(message: 'Failed (HTTP ${res.statusCode})');
    } on DioException catch (e) {
      throw ServerFailure(message: e.message ?? 'Failed to load summary');
    }
  }
}

