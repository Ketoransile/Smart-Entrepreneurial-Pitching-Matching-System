import 'package:dio/dio.dart';

import '../../../../core/config/api_config.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/network/dio_client.dart';
import '../models/submission_model.dart';

abstract class SubmissionsRemoteDataSource {
  Future<List<SubmissionModel>> listMySubmissions();
  Future<SubmissionModel> createDraft({String? title, String? sector, String? stage});
  Future<SubmissionModel> getById(String id);
  Future<SubmissionModel> updateDraft(String id, Map<String, dynamic> patch);
  Future<void> deleteDraft(String id);
  Future<void> submit(String id);
  Future<Map<String, dynamic>> completeness(String id);
}

class SubmissionsRemoteDataSourceImpl implements SubmissionsRemoteDataSource {
  final DioClient _dio;
  SubmissionsRemoteDataSourceImpl({required DioClient dioClient}) : _dio = dioClient;

  @override
  Future<List<SubmissionModel>> listMySubmissions() async {
    try {
      final res = await _dio.get(ApiConfig.submissions);
      if (res.statusCode == 200) {
        final data = res.data as Map<String, dynamic>;
        final list = (data['submissions'] as List?) ?? (data['data'] as List?) ?? (res.data as List?) ?? const [];
        return list
            .whereType<Map>()
            .map((e) => SubmissionModel.fromJson(e.cast<String, dynamic>()))
            .toList();
      }
      throw ServerFailure(message: 'Failed (HTTP ${res.statusCode})');
    } on DioException catch (e) {
      final status = e.response?.statusCode;
      if (status == 401 || status == 403) {
        throw const AuthFailure(message: 'Not authorized');
      }
      throw ServerFailure(message: e.message ?? 'Failed to load submissions');
    }
  }

  @override
  Future<SubmissionModel> createDraft({String? title, String? sector, String? stage}) async {
    try {
      final res = await _dio.post(
        ApiConfig.submissions,
        data: {
          if (title != null && title.isNotEmpty) 'title': title,
          if (sector != null && sector.isNotEmpty) 'sector': sector,
          if (stage != null && stage.isNotEmpty) 'stage': stage,
        },
      );
      if (res.statusCode == 201 || res.statusCode == 200) {
        final data = res.data as Map<String, dynamic>;
        final s = (data['submission'] as Map?)?.cast<String, dynamic>() ?? data;
        return SubmissionModel.fromJson(s);
      }
      throw const ServerFailure(message: 'Failed to create draft');
    } on DioException catch (e) {
      final status = e.response?.statusCode;
      if (status == 403) {
        throw const AuthFailure(message: 'User is not verified');
      }
      throw ServerFailure(message: e.message ?? 'Failed to create draft');
    }
  }

  @override
  Future<SubmissionModel> getById(String id) async {
    try {
      final res = await _dio.get(ApiConfig.submissionById(id));
      if (res.statusCode == 200) {
        final data = res.data as Map<String, dynamic>;
        final s = (data['submission'] as Map?)?.cast<String, dynamic>() ?? data;
        return SubmissionModel.fromJson(s);
      }
      throw ServerFailure(message: 'Failed (HTTP ${res.statusCode})');
    } on DioException catch (e) {
      final status = e.response?.statusCode;
      if (status == 404) throw const ServerFailure(message: 'Submission not found');
      throw ServerFailure(message: e.message ?? 'Failed to load submission');
    }
  }

  @override
  Future<SubmissionModel> updateDraft(String id, Map<String, dynamic> patch) async {
    try {
      final res = await _dio.patch(ApiConfig.submissionById(id), data: patch);
      if (res.statusCode == 200) {
        final data = res.data as Map<String, dynamic>;
        final s = (data['submission'] as Map?)?.cast<String, dynamic>() ?? data;
        return SubmissionModel.fromJson(s);
      }
      throw const ServerFailure(message: 'Failed to update draft');
    } on DioException catch (e) {
      throw ServerFailure(message: e.message ?? 'Failed to update draft');
    }
  }

  @override
  Future<void> deleteDraft(String id) async {
    try {
      final res = await _dio.delete(ApiConfig.submissionById(id));
      if (res.statusCode == 200) return;
      throw ServerFailure(message: 'Failed (HTTP ${res.statusCode})');
    } on DioException catch (e) {
      throw ServerFailure(message: e.message ?? 'Failed to delete draft');
    }
  }

  @override
  Future<void> submit(String id) async {
    try {
      final res = await _dio.post(ApiConfig.submissionSubmit(id));
      if (res.statusCode == 200) return;
      throw ServerFailure(message: 'Failed (HTTP ${res.statusCode})');
    } on DioException catch (e) {
      throw ServerFailure(message: e.message ?? 'Failed to submit pitch');
    }
  }

  @override
  Future<Map<String, dynamic>> completeness(String id) async {
    try {
      final res = await _dio.get(ApiConfig.submissionCompleteness(id));
      if (res.statusCode == 200) {
        return (res.data as Map).cast<String, dynamic>();
      }
      throw ServerFailure(message: 'Failed (HTTP ${res.statusCode})');
    } on DioException catch (e) {
      throw ServerFailure(message: e.message ?? 'Failed to get completeness');
    }
  }
}

