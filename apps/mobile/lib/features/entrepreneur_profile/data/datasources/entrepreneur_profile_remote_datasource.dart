import 'package:dio/dio.dart';

import '../../../../core/config/api_config.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/network/dio_client.dart';
import '../models/entrepreneur_profile_model.dart';

abstract class EntrepreneurProfileRemoteDataSource {
  Future<bool> hasProfile();
  Future<EntrepreneurProfileModel> getProfile();
  Future<EntrepreneurProfileModel> createProfile({
    required String fullName,
    required String companyName,
    required String companyRegistrationNumber,
    required String businessSector,
    required String businessStage,
  });
  Future<EntrepreneurProfileModel> updateProfile(Map<String, dynamic> patch);
}

class EntrepreneurProfileRemoteDataSourceImpl
    implements EntrepreneurProfileRemoteDataSource {
  final DioClient _dio;
  EntrepreneurProfileRemoteDataSourceImpl({required DioClient dioClient})
      : _dio = dioClient;

  @override
  Future<bool> hasProfile() async {
    if (ApiConfig.useMockData) {
      await Future<void>.delayed(ApiConfig.mockLatency);
      return true;
    }
    try {
      final res = await _dio.get(ApiConfig.entrepreneurProfileCheck);
      if (res.statusCode != 200) return false;
      final data = res.data;
      if (data is Map<String, dynamic>) {
        final payload = data['data'];
        if (payload is Map<String, dynamic>) {
          return payload['hasProfile'] == true;
        }
      }
      return false;
    } on DioException catch (e) {
      if (e.response?.statusCode == 401 || e.response?.statusCode == 403) {
        throw const AuthFailure(message: 'Not authorized');
      }
      throw ServerFailure(message: e.message ?? 'Failed to check profile');
    }
  }

  @override
  Future<EntrepreneurProfileModel> getProfile() async {
    if (ApiConfig.useMockData) {
      await Future<void>.delayed(ApiConfig.mockLatency);
      return EntrepreneurProfileModel.fromJson({
        '_id': 'entrepreneur_profile_001',
        'userId': 'user_entrepreneur_001',
        'fullName': 'Demo Entrepreneur',
        'companyName': 'ClinicFlow Ltd',
        'companyRegistrationNumber': 'REG-2024-00123',
        'businessSector': 'Health',
        'businessStage': 'earlyRevenue',
        'bio':
            'Founder building operational tools for rural clinics. Background in product and health systems.',
        'website': 'https://example.com/clinicflow',
        'location': 'Addis Ababa',
        'teamSize': 6,
        'createdAt': DateTime.now()
            .toUtc()
            .subtract(const Duration(days: 90))
            .toIso8601String(),
        'updatedAt': DateTime.now().toUtc().toIso8601String(),
      });
    }
    try {
      final res = await _dio.get(ApiConfig.entrepreneurProfile);
      if (res.statusCode == 200) {
        final data = res.data as Map<String, dynamic>;
        final profile = (data['data'] as Map?)?.cast<String, dynamic>() ??
            (data['profile'] as Map?)?.cast<String, dynamic>() ??
            (data['entrepreneurProfile'] as Map?)?.cast<String, dynamic>() ??
            data;
        return EntrepreneurProfileModel.fromJson(profile);
      }
      throw ServerFailure(message: 'Failed (HTTP ${res.statusCode})');
    } on DioException catch (e) {
      final status = e.response?.statusCode;
      if (status == 401 || status == 403) {
        throw const AuthFailure(message: 'Not authorized');
      }
      if (status == 404) {
        throw const ServerFailure(message: 'Profile not found');
      }
      throw ServerFailure(message: e.message ?? 'Failed to load profile');
    }
  }

  @override
  Future<EntrepreneurProfileModel> createProfile({
    required String fullName,
    required String companyName,
    required String companyRegistrationNumber,
    required String businessSector,
    required String businessStage,
  }) async {
    if (ApiConfig.useMockData) {
      await Future<void>.delayed(ApiConfig.mockLatency);
      return EntrepreneurProfileModel.fromJson({
        '_id': 'entrepreneur_profile_001',
        'userId': 'user_entrepreneur_001',
        'fullName': fullName,
        'companyName': companyName,
        'companyRegistrationNumber': companyRegistrationNumber,
        'businessSector': businessSector,
        'businessStage': businessStage,
        'createdAt': DateTime.now().toUtc().toIso8601String(),
        'updatedAt': DateTime.now().toUtc().toIso8601String(),
      });
    }
    try {
      final res = await _dio.post(
        ApiConfig.entrepreneurProfile,
        data: {
          'fullName': fullName,
          'companyName': companyName,
          'companyRegistrationNumber': companyRegistrationNumber,
          'businessSector': businessSector,
          'businessStage': businessStage,
        },
      );
      if (res.statusCode == 201 || res.statusCode == 200) {
        final data = res.data as Map<String, dynamic>;
        final profile = (data['data'] as Map?)?.cast<String, dynamic>() ??
            (data['profile'] as Map?)?.cast<String, dynamic>() ??
            data;
        return EntrepreneurProfileModel.fromJson(profile);
      }
      throw const ServerFailure(message: 'Failed to create profile');
    } on DioException catch (e) {
      final status = e.response?.statusCode;
      if (status == 401 || status == 403) {
        throw const AuthFailure(message: 'Not authorized');
      }
      throw ServerFailure(message: e.message ?? 'Failed to create profile');
    }
  }

  @override
  Future<EntrepreneurProfileModel> updateProfile(Map<String, dynamic> patch) async {
    if (ApiConfig.useMockData) {
      await Future<void>.delayed(ApiConfig.mockLatency);
      final base = (await getProfile()).data;
      final updated = Map<String, dynamic>.from(base)..addAll(patch);
      updated['updatedAt'] = DateTime.now().toUtc().toIso8601String();
      return EntrepreneurProfileModel.fromJson(updated);
    }
    try {
      final res = await _dio.put(
        ApiConfig.entrepreneurProfile,
        data: patch,
      );
      if (res.statusCode == 200) {
        final data = res.data as Map<String, dynamic>;
        final profile = (data['data'] as Map?)?.cast<String, dynamic>() ??
            (data['profile'] as Map?)?.cast<String, dynamic>() ??
            data;
        return EntrepreneurProfileModel.fromJson(profile);
      }
      throw const ServerFailure(message: 'Failed to update profile');
    } on DioException catch (e) {
      final status = e.response?.statusCode;
      if (status == 401 || status == 403) {
        throw const AuthFailure(message: 'Not authorized');
      }
      throw ServerFailure(message: e.message ?? 'Failed to update profile');
    }
  }
}

