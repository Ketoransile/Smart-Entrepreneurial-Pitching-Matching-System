import 'package:dio/dio.dart';

import '../../../../core/config/api_config.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/network/dio_client.dart';
import '../models/investor_profile_model.dart';

abstract class InvestorProfileRemoteDataSource {
  Future<InvestorProfileModel> getProfile();
  Future<InvestorProfileModel> createProfile(Map<String, dynamic> payload);
  Future<InvestorProfileModel> updateProfile(Map<String, dynamic> payload);
}

class InvestorProfileRemoteDataSourceImpl implements InvestorProfileRemoteDataSource {
  final DioClient _dio;
  InvestorProfileRemoteDataSourceImpl({required DioClient dioClient}) : _dio = dioClient;

  @override
  Future<InvestorProfileModel> getProfile() async {
    try {
      final res = await _dio.get(ApiConfig.investorProfile);
      if (res.statusCode == 200) {
        final data = res.data as Map<String, dynamic>;
        final profile = (data['profile'] as Map?)?.cast<String, dynamic>() ??
            (data['investorProfile'] as Map?)?.cast<String, dynamic>() ??
            data;
        return InvestorProfileModel.fromJson(profile);
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
  Future<InvestorProfileModel> createProfile(Map<String, dynamic> payload) async {
    try {
      final res = await _dio.post(ApiConfig.investorProfile, data: payload);
      if (res.statusCode == 201 || res.statusCode == 200) {
        final data = res.data as Map<String, dynamic>;
        final profile = (data['profile'] as Map?)?.cast<String, dynamic>() ?? data;
        return InvestorProfileModel.fromJson(profile);
      }
      throw const ServerFailure(message: 'Failed to create profile');
    } on DioException catch (e) {
      throw ServerFailure(message: e.message ?? 'Failed to create profile');
    }
  }

  @override
  Future<InvestorProfileModel> updateProfile(Map<String, dynamic> payload) async {
    try {
      final res = await _dio.put(ApiConfig.investorProfile, data: payload);
      if (res.statusCode == 200) {
        final data = res.data as Map<String, dynamic>;
        final profile = (data['profile'] as Map?)?.cast<String, dynamic>() ?? data;
        return InvestorProfileModel.fromJson(profile);
      }
      throw const ServerFailure(message: 'Failed to update profile');
    } on DioException catch (e) {
      throw ServerFailure(message: e.message ?? 'Failed to update profile');
    }
  }
}

