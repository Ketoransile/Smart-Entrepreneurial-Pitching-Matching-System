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

  static final List<Map<String, dynamic>> _mockFeedback = [
    {
      '_id': 'fb_001',
      'invitationId': 'inv_002',
      'matchResultId': 'match_001',
      'submissionId': 'pitch_002',
      'fromUserId': 'user_investor_001',
      'toUserId': 'user_entrepreneur_001',
      'rating': 5,
      'category': 'communication',
      'comment': 'Clear, fast responses. Great to work with.',
      'createdAt': DateTime.now().toUtc().subtract(const Duration(days: 5)).toIso8601String(),
      'updatedAt': DateTime.now().toUtc().subtract(const Duration(days: 5)).toIso8601String(),
    },
    {
      '_id': 'fb_002',
      'invitationId': 'inv_002',
      'matchResultId': 'match_001',
      'submissionId': 'pitch_002',
      'fromUserId': 'user_entrepreneur_001',
      'toUserId': 'user_investor_001',
      'rating': 4,
      'category': 'professionalism',
      'comment': 'Constructive feedback and strong follow-up.',
      'createdAt': DateTime.now().toUtc().subtract(const Duration(days: 4)).toIso8601String(),
      'updatedAt': DateTime.now().toUtc().subtract(const Duration(days: 4)).toIso8601String(),
    },
  ];

  @override
  Future<FeedbackModel> submit(Map<String, dynamic> payload) async {
    if (ApiConfig.useMockData) {
      await Future<void>.delayed(ApiConfig.mockLatency);
      final now = DateTime.now().toUtc();
      final fb = <String, dynamic>{
        '_id': 'fb_${now.millisecondsSinceEpoch}',
        ...payload,
        'createdAt': now.toIso8601String(),
        'updatedAt': now.toIso8601String(),
      };
      _mockFeedback.insert(0, fb);
      return FeedbackModel.fromJson(fb);
    }
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
    if (ApiConfig.useMockData) {
      await Future<void>.delayed(ApiConfig.mockLatency);
      return _mockFeedback
          .where((f) => f['toUserId'] == 'user_entrepreneur_001')
          .map((e) => FeedbackModel.fromJson(e))
          .toList();
    }
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
    if (ApiConfig.useMockData) {
      await Future<void>.delayed(ApiConfig.mockLatency);
      return _mockFeedback
          .where((f) => f['fromUserId'] == 'user_entrepreneur_001')
          .map((e) => FeedbackModel.fromJson(e))
          .toList();
    }
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
    if (ApiConfig.useMockData) {
      await Future<void>.delayed(ApiConfig.mockLatency);
      final received = _mockFeedback.where((f) => f['toUserId'] == 'user_entrepreneur_001').toList();
      final given = _mockFeedback.where((f) => f['fromUserId'] == 'user_entrepreneur_001').toList();
      final avg = received.isEmpty
          ? 0.0
          : received
                  .map((f) => (f['rating'] as num?)?.toDouble() ?? 0.0)
                  .reduce((a, b) => a + b) /
              received.length;
      return {
        'receivedCount': received.length,
        'givenCount': given.length,
        'averageRating': double.parse(avg.toStringAsFixed(2)),
        'updatedAt': DateTime.now().toUtc().toIso8601String(),
      };
    }
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

