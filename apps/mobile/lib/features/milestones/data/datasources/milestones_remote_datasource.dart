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

  static final List<Map<String, dynamic>> _mockMilestones = [
    {
      '_id': 'ms_001',
      'submissionId': 'pitch_002',
      'matchResultId': 'match_001',
      'entrepreneurId': 'user_entrepreneur_001',
      'investorId': 'user_investor_001',
      'createdBy': 'user_investor_001',
      'title': 'Pilot expansion to 10 clinics',
      'description': 'Deploy to 10 clinics and report monthly active usage.',
      'amount': 50000,
      'currency': 'USD',
      'dueDate': DateTime.now().toUtc().add(const Duration(days: 30)).toIso8601String(),
      'evidenceDocuments': const [],
      'escrowStatus': 'held',
      'escrowReference': 'escrow_mock_001',
      'status': 'in_progress',
      'createdAt': DateTime.now().toUtc().subtract(const Duration(days: 3)).toIso8601String(),
      'updatedAt': DateTime.now().toUtc().toIso8601String(),
    },
    {
      '_id': 'ms_002',
      'submissionId': 'pitch_002',
      'matchResultId': 'match_001',
      'entrepreneurId': 'user_entrepreneur_001',
      'investorId': 'user_investor_001',
      'createdBy': 'user_entrepreneur_001',
      'title': 'Integrate reporting dashboard',
      'description': 'Ship reporting dashboard and share screenshots + usage stats.',
      'amount': 25000,
      'currency': 'USD',
      'dueDate': DateTime.now().toUtc().add(const Duration(days: 45)).toIso8601String(),
      'evidenceDocuments': const [],
      'escrowStatus': 'not_held',
      'status': 'pending',
      'createdAt': DateTime.now().toUtc().subtract(const Duration(days: 1)).toIso8601String(),
      'updatedAt': DateTime.now().toUtc().toIso8601String(),
    },
  ];

  @override
  Future<List<MilestoneModel>> list({
    String? submissionId,
    String? matchResultId,
    String? status,
  }) async {
    if (ApiConfig.useMockData) {
      await Future<void>.delayed(ApiConfig.mockLatency);
      Iterable<Map<String, dynamic>> list = _mockMilestones;
      if (submissionId != null && submissionId.isNotEmpty) {
        list = list.where((m) => m['submissionId'] == submissionId);
      }
      if (matchResultId != null && matchResultId.isNotEmpty) {
        list = list.where((m) => m['matchResultId'] == matchResultId);
      }
      if (status != null && status.isNotEmpty) {
        list = list.where((m) => (m['status'] as String?) == status);
      }
      return list.map((e) => MilestoneModel.fromJson(e)).toList();
    }
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
    if (ApiConfig.useMockData) {
      await Future<void>.delayed(ApiConfig.mockLatency);
      final now = DateTime.now().toUtc();
      final id = 'ms_${100 + _mockMilestones.length}';
      final m = <String, dynamic>{
        '_id': id,
        'submissionId': payload['submissionId'] ?? 'pitch_002',
        'matchResultId': payload['matchResultId'] ?? 'match_001',
        'entrepreneurId': payload['entrepreneurId'] ?? 'user_entrepreneur_001',
        'investorId': payload['investorId'] ?? 'user_investor_001',
        'createdBy': payload['createdBy'] ?? 'user_investor_001',
        'title': payload['title'] ?? 'New milestone',
        if (payload['description'] != null) 'description': payload['description'],
        'amount': (payload['amount'] as num?)?.toDouble() ?? 10000,
        'currency': payload['currency'] ?? 'USD',
        'dueDate': payload['dueDate'] ?? now.add(const Duration(days: 14)).toIso8601String(),
        'evidenceDocuments': const [],
        'escrowStatus': payload['escrowStatus'] ?? 'not_held',
        'status': payload['status'] ?? 'pending',
        'createdAt': now.toIso8601String(),
        'updatedAt': now.toIso8601String(),
      };
      _mockMilestones.insert(0, m);
      return MilestoneModel.fromJson(m);
    }
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
    if (ApiConfig.useMockData) {
      await Future<void>.delayed(ApiConfig.mockLatency);
      final idx = _mockMilestones.indexWhere((m) => m['_id'] == milestoneId || m['id'] == milestoneId);
      final now = DateTime.now().toUtc();
      if (idx != -1) {
        final updated = Map<String, dynamic>.from(_mockMilestones[idx])..addAll(payload);
        updated['updatedAt'] = now.toIso8601String();
        _mockMilestones[idx] = updated;
        return MilestoneModel.fromJson(updated);
      }
      final created = Map<String, dynamic>.from(payload);
      created['_id'] = milestoneId;
      created['createdAt'] = now.toIso8601String();
      created['updatedAt'] = now.toIso8601String();
      _mockMilestones.insert(0, created);
      return MilestoneModel.fromJson(created);
    }
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
    if (ApiConfig.useMockData) {
      await Future<void>.delayed(ApiConfig.mockLatency);
      final idx = _mockMilestones.indexWhere((m) => m['_id'] == milestoneId || m['id'] == milestoneId);
      if (idx == -1) return;
      final now = DateTime.now().toUtc();
      final updated = Map<String, dynamic>.from(_mockMilestones[idx]);
      updated['status'] = 'submitted_for_review';
      updated['submittedAt'] = now.toIso8601String();
      updated['proof'] = payload['proof'];
      updated['evidenceDocuments'] = payload['evidenceDocuments'] ?? updated['evidenceDocuments'] ?? const [];
      updated['updatedAt'] = now.toIso8601String();
      _mockMilestones[idx] = updated;
      return;
    }
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
    if (ApiConfig.useMockData) {
      await Future<void>.delayed(ApiConfig.mockLatency);
      final idx = _mockMilestones.indexWhere((m) => m['_id'] == milestoneId || m['id'] == milestoneId);
      if (idx == -1) return;
      final now = DateTime.now().toUtc();
      final updated = Map<String, dynamic>.from(_mockMilestones[idx]);
      final approved = payload['approved'] == true || payload['status'] == 'verified_paid';
      updated['status'] = approved ? 'verified_paid' : 'rejected';
      updated['verifiedAt'] = now.toIso8601String();
      updated['verifiedBy'] = payload['verifiedBy'] ?? 'user_investor_001';
      updated['verificationNotes'] = payload['verificationNotes'];
      if (approved) {
        updated['escrowStatus'] = 'released';
        updated['paymentReleasedAt'] = now.toIso8601String();
        updated['paymentReference'] = 'pay_mock_${now.millisecondsSinceEpoch}';
      }
      updated['updatedAt'] = now.toIso8601String();
      _mockMilestones[idx] = updated;
      return;
    }
    try {
      final res = await _dio.post(ApiConfig.milestoneVerify(milestoneId), data: payload);
      if (res.statusCode == 200) return;
      throw ServerFailure(message: 'Failed (HTTP ${res.statusCode})');
    } on DioException catch (e) {
      throw ServerFailure(message: e.message ?? 'Failed to verify milestone');
    }
  }
}

