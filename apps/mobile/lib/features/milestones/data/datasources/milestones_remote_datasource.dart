import 'package:dio/dio.dart';

import '../../../../core/config/api_config.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/network/dio_client.dart';
import '../models/milestone_model.dart';

abstract class MilestonesRemoteDataSource {
  Future<List<MilestoneModel>> list({
    String? submissionId,
    String? matchResultId,
    String? status,
  });
  Future<MilestoneModel> create(Map<String, dynamic> payload);
  Future<MilestoneModel> update(String milestoneId, Map<String, dynamic> payload);
  Future<void> submitEvidence(String milestoneId, Map<String, dynamic> payload);
  Future<void> verify(String milestoneId, Map<String, dynamic> payload);
}

class MilestonesRemoteDataSourceImpl implements MilestonesRemoteDataSource {
  final DioClient _dio;
  MilestonesRemoteDataSourceImpl({required DioClient dioClient}) : _dio = dioClient;

  @override
  Future<List<MilestoneModel>> list({
    String? submissionId,
    String? matchResultId,
    String? status,
  }) async {
    try {
      final res = await _dio.get(
        ApiConfig.milestones,
        queryParameters: {
          if (submissionId != null && submissionId.isNotEmpty) 'submissionId': submissionId,
          if (matchResultId != null && matchResultId.isNotEmpty) 'matchResultId': matchResultId,
          if (status != null && status.isNotEmpty) 'status': status,
        },
      );
      if (res.statusCode == 200) {
        final data = res.data as Map<String, dynamic>;
        final list = (data['milestones'] as List?) ?? (data['data'] as List?) ?? const [];
        return list
            .whereType<Map>()
            .map((e) => MilestoneModel.fromJson(e.cast<String, dynamic>()))
            .toList();
      }
      throw ServerFailure(message: 'Failed (HTTP ${res.statusCode})');
    } on DioException catch (e) {
      throw ServerFailure(message: e.message ?? 'Failed to load milestones');
    }
  }

  @override
  Future<MilestoneModel> create(Map<String, dynamic> payload) async {
    try {
      final res = await _dio.post(ApiConfig.milestones, data: payload);
      if (res.statusCode == 201 || res.statusCode == 200) {
        final data = res.data as Map<String, dynamic>;
        final m = (data['milestone'] as Map?)?.cast<String, dynamic>() ?? data;
        return MilestoneModel.fromJson(m);
      }
      throw const ServerFailure(message: 'Failed to create milestone');
    } on DioException catch (e) {
      throw ServerFailure(message: e.message ?? 'Failed to create milestone');
    }
  }

  @override
  Future<MilestoneModel> update(String milestoneId, Map<String, dynamic> payload) async {
    try {
      final res = await _dio.patch(ApiConfig.milestoneById(milestoneId), data: payload);
      if (res.statusCode == 200) {
        final data = res.data as Map<String, dynamic>;
        final m = (data['milestone'] as Map?)?.cast<String, dynamic>() ?? data;
        return MilestoneModel.fromJson(m);
      }
      throw const ServerFailure(message: 'Failed to update milestone');
    } on DioException catch (e) {
      throw ServerFailure(message: e.message ?? 'Failed to update milestone');
    }
  }

  @override
  Future<void> submitEvidence(String milestoneId, Map<String, dynamic> payload) async {
    try {
      final res = await _dio.post(ApiConfig.milestoneEvidence(milestoneId), data: payload);
      if (res.statusCode == 200) return;
      throw ServerFailure(message: 'Failed (HTTP ${res.statusCode})');
    } on DioException catch (e) {
      throw ServerFailure(message: e.message ?? 'Failed to submit evidence');
    }
  }

  @override
  Future<void> verify(String milestoneId, Map<String, dynamic> payload) async {
    try {
      final res = await _dio.post(ApiConfig.milestoneVerify(milestoneId), data: payload);
      if (res.statusCode == 200) return;
      throw ServerFailure(message: 'Failed (HTTP ${res.statusCode})');
    } on DioException catch (e) {
      throw ServerFailure(message: e.message ?? 'Failed to verify milestone');
    }
  }
}

