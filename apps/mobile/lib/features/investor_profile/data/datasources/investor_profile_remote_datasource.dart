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
    if (ApiConfig.useMockData) {
      await Future<void>.delayed(ApiConfig.mockLatency);
      return InvestorProfileModel.fromJson({
        '_id': 'investor_profile_001',
        'userId': 'user_investor_001',
        'fullName': 'Alemu Bekele',
        'fundName': 'Blue Nile Ventures',
        'bio': 'Early-stage investor focused on health, fintech, and logistics.',
        'preferredSectors': ['Health', 'Fintech', 'Logistics'],
        'ticketSizeMin': 25000,
        'ticketSizeMax': 150000,
        'currency': 'USD',
        'location': 'Addis Ababa',
        'createdAt': DateTime.now()
            .toUtc()
            .subtract(const Duration(days: 220))
            .toIso8601String(),
        'updatedAt': DateTime.now().toUtc().toIso8601String(),
      });
    }
    try {
      final res = await _dio.get(ApiConfig.investorProfile);
      if (res.statusCode == 200) {
        final data = res.data as Map<String, dynamic>;
        final profile = (data['data'] as Map?)?.cast<String, dynamic>() ??
            (data['profile'] as Map?)?.cast<String, dynamic>() ??
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
    if (ApiConfig.useMockData) {
      await Future<void>.delayed(ApiConfig.mockLatency);
      final now = DateTime.now().toUtc().toIso8601String();
      return InvestorProfileModel.fromJson({
        '_id': 'investor_profile_001',
        'userId': payload['userId'] ?? 'user_investor_001',
        ...payload,
        'createdAt': now,
        'updatedAt': now,
      });
    }
    try {
      final res = await _dio.post(ApiConfig.investorProfile, data: payload);
      if (res.statusCode == 201 || res.statusCode == 200) {
        final data = res.data as Map<String, dynamic>;
        final profile = (data['data'] as Map?)?.cast<String, dynamic>() ??
            (data['profile'] as Map?)?.cast<String, dynamic>() ??
            data;
        return InvestorProfileModel.fromJson(profile);
      }
      throw const ServerFailure(message: 'Failed to create profile');
    } on DioException catch (e) {
      throw ServerFailure(message: e.message ?? 'Failed to create profile');
    }
  }

  @override
  Future<InvestorProfileModel> updateProfile(Map<String, dynamic> payload) async {
    if (ApiConfig.useMockData) {
      await Future<void>.delayed(ApiConfig.mockLatency);
      final base = (await getProfile()).data;
      final updated = Map<String, dynamic>.from(base)..addAll(payload);
      updated['updatedAt'] = DateTime.now().toUtc().toIso8601String();
      return InvestorProfileModel.fromJson(updated);
    }
    try {
      final res = await _dio.put(ApiConfig.investorProfile, data: payload);
      if (res.statusCode == 200) {
        final data = res.data as Map<String, dynamic>;
        final profile = (data['data'] as Map?)?.cast<String, dynamic>() ??
            (data['profile'] as Map?)?.cast<String, dynamic>() ??
            data;
        return InvestorProfileModel.fromJson(profile);
      }
      throw const ServerFailure(message: 'Failed to update profile');
    } on DioException catch (e) {
      throw ServerFailure(message: e.message ?? 'Failed to update profile');
    }
  }
}

