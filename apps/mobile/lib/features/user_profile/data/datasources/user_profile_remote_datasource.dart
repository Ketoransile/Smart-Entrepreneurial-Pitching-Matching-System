import 'package:dio/dio.dart';

import '../../../../core/config/api_config.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/network/dio_client.dart';
import '../models/user_profile_model.dart';

abstract class UserProfileRemoteDataSource {
  Future<UserProfileModel> getMyProfile();
}

class UserProfileRemoteDataSourceImpl implements UserProfileRemoteDataSource {
  final DioClient _dioClient;

  UserProfileRemoteDataSourceImpl({required DioClient dioClient})
      : _dioClient = dioClient;

  @override
  Future<UserProfileModel> getMyProfile() async {
    if (ApiConfig.useMockData) {
      await Future<void>.delayed(ApiConfig.mockLatency);
      return UserProfileModel.fromJson({
        '_id': 'user_entrepreneur_001',
        'email': 'demo@sepms.app',
        'fullName': 'Demo Entrepreneur',
        'role': 'entrepreneur',
        'status': 'verified',
        'photoURL': 'https://i.pravatar.cc/300?img=12',
        'roleProfile': {
          'companyName': 'ClinicFlow Ltd',
          'businessSector': 'Health',
          'businessStage': 'earlyRevenue',
          'location': 'Addis Ababa',
        },
        'createdAt': DateTime.now()
            .toUtc()
            .subtract(const Duration(days: 120))
            .toIso8601String(),
        'updatedAt': DateTime.now().toUtc().toIso8601String(),
      });
    }
    try {
      final response = await _dioClient.get(ApiConfig.usersMeProfile);

      if (response.statusCode == 200) {
        final data = response.data as Map<String, dynamic>;
        return UserProfileModel.fromJson(data);
      }

      throw ServerFailure(
        message: 'Failed to load profile (HTTP ${response.statusCode})',
      );
    } on DioException catch (e) {
      if (e.type == DioExceptionType.connectionTimeout ||
          e.type == DioExceptionType.sendTimeout ||
          e.type == DioExceptionType.receiveTimeout ||
          e.type == DioExceptionType.connectionError) {
        throw const NetworkFailure();
      }
      final status = e.response?.statusCode;
      if (status == 401 || status == 403) {
        throw const AuthFailure(
          message: 'Session expired or not authorized. Please sign in again.',
        );
      }
      throw ServerFailure(message: e.message ?? 'Could not reach the server');
    }
  }
}

