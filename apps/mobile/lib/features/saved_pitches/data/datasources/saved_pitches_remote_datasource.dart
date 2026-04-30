import 'package:dio/dio.dart';

import '../../../../core/config/api_config.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/mock/mock_backend.dart';
import '../../../../core/network/dio_client.dart';
import '../../../submissions/data/models/submission_model.dart';

abstract class SavedPitchesRemoteDataSource {
  Future<List<SubmissionModel>> listSaved();
  Future<void> toggleSaved(String pitchId);
}

class SavedPitchesRemoteDataSourceImpl implements SavedPitchesRemoteDataSource {
  final DioClient _dio;
  SavedPitchesRemoteDataSourceImpl({required DioClient dioClient}) : _dio = dioClient;

  @override
  Future<List<SubmissionModel>> listSaved() async {
    if (ApiConfig.useMockData) {
      await Future<void>.delayed(ApiConfig.mockLatency);
      return MockBackend.listSavedPitches();
    }
    try {
      final res = await _dio.get(ApiConfig.investorSavedPitches);
      if (res.statusCode == 200) {
        final data = res.data as Map<String, dynamic>;
        final list = (data['savedPitches'] as List?) ??
            (data['pitches'] as List?) ??
            (data['data'] as List?) ??
            const [];
        return list
            .whereType<Map>()
            .map((e) => SubmissionModel.fromJson(e.cast<String, dynamic>()))
            .toList();
      }
      throw ServerFailure(message: 'Failed (HTTP ${res.statusCode})');
    } on DioException catch (e) {
      throw ServerFailure(message: e.message ?? 'Failed to load saved pitches');
    }
  }

  @override
  Future<void> toggleSaved(String pitchId) async {
    if (ApiConfig.useMockData) {
      await Future<void>.delayed(ApiConfig.mockLatency);
      MockBackend.toggleSaved(pitchId);
      return;
    }
    try {
      final res = await _dio.post('${ApiConfig.investorSavedPitches}/$pitchId');
      if (res.statusCode == 200) return;
      throw ServerFailure(message: 'Failed (HTTP ${res.statusCode})');
    } on DioException catch (e) {
      throw ServerFailure(message: e.message ?? 'Failed to toggle saved pitch');
    }
  }
}

