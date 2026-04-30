import 'package:dio/dio.dart';

import '../../../../core/config/api_config.dart';
import '../../../../core/config/urls.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/mock/mock_backend.dart';
import '../../../../core/network/dio_client.dart';
import '../models/meeting_model.dart';

abstract class MeetingsRemoteDataSource {
  Future<List<MeetingModel>> list({String? status});
  Future<MeetingModel> schedule(Map<String, dynamic> payload);
  Future<MeetingModel> updateStatus(
      String meetingId, Map<String, dynamic> payload);
}

class MeetingsRemoteDataSourceImpl implements MeetingsRemoteDataSource {
  final DioClient _dio;
  MeetingsRemoteDataSourceImpl({required DioClient dioClient})
      : _dio = dioClient;

  @override
  Future<List<MeetingModel>> list({String? status}) async {
    if (ApiConfig.useMockData) {
      await Future<void>.delayed(ApiConfig.mockLatency);
      return MockBackend.listMeetings(status: status);
    }
    try {
      final res = await _dio.get(
        Urls.listMeetings,
        queryParameters: {
          if (status != null && status.isNotEmpty) 'status': status
        },
      );
      if (res.statusCode == 200) {
        final data = res.data as Map<String, dynamic>;
        final list =
            (data['meetings'] as List?) ?? (data['data'] as List?) ?? const [];
        return list
            .whereType<Map>()
            .map((e) => MeetingModel.fromJson(e.cast<String, dynamic>()))
            .toList();
      }
      throw ServerFailure(message: 'Failed (HTTP ${res.statusCode})');
    } on DioException catch (e) {
      throw ServerFailure(message: e.message ?? 'Failed to load meetings');
    }
  }

  @override
  Future<MeetingModel> schedule(Map<String, dynamic> payload) async {
    if (ApiConfig.useMockData) {
      await Future<void>.delayed(ApiConfig.mockLatency);
      return MockBackend.scheduleMeeting(payload);
    }
    try {
      final res = await _dio.post(Urls.scheduleMeeting, data: payload);
      if (res.statusCode == 201 || res.statusCode == 200) {
        final data = res.data as Map<String, dynamic>;
        final m = (data['meeting'] as Map?)?.cast<String, dynamic>() ?? data;
        return MeetingModel.fromJson(m);
      }
      throw const ServerFailure(message: 'Failed to schedule meeting');
    } on DioException catch (e) {
      throw ServerFailure(message: e.message ?? 'Failed to schedule meeting');
    }
  }

  @override
  Future<MeetingModel> updateStatus(
      String meetingId, Map<String, dynamic> payload) async {
    if (ApiConfig.useMockData) {
      await Future<void>.delayed(ApiConfig.mockLatency);
      return MockBackend.updateMeetingStatus(meetingId, payload);
    }
    try {
      final res = await _dio.patch(
          Urls.buildUrl(Urls.updateMeetingStatus, meetingId),
          data: payload);
      if (res.statusCode == 200) {
        final data = res.data as Map<String, dynamic>;
        final m = (data['meeting'] as Map?)?.cast<String, dynamic>() ?? data;
        return MeetingModel.fromJson(m);
      }
      throw const ServerFailure(message: 'Failed to update meeting');
    } on DioException catch (e) {
      throw ServerFailure(message: e.message ?? 'Failed to update meeting');
    }
  }
}
