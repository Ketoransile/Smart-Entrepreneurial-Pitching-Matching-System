import 'package:dio/dio.dart';

import '../../../../core/config/api_config.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/network/dio_client.dart';
import '../models/invitation_model.dart';

abstract class InvitationsManageRemoteDataSource {
  Future<List<InvitationModel>> listMine({String? status, String? direction});
  Future<InvitationModel> respond({
    required String invitationId,
    required String status, // accepted|declined
    String? responseMessage,
  });
  Future<InvitationModel> cancel(String invitationId);
}

class InvitationsManageRemoteDataSourceImpl
    implements InvitationsManageRemoteDataSource {
  final DioClient _dio;
  InvitationsManageRemoteDataSourceImpl({required DioClient dioClient})
      : _dio = dioClient;

  static final List<Map<String, dynamic>> _mockInvitations = [
    {
      '_id': 'inv_001',
      'matchResultId': 'match_001',
      'submissionId': 'pitch_002',
      'entrepreneurId': 'user_entrepreneur_001',
      'investorId': 'user_investor_001',
      'senderId': 'user_investor_001',
      'receiverId': 'user_entrepreneur_001',
      'message': 'Would love to connect about ClinicFlow. Are you free tomorrow?',
      'status': 'pending',
      'sentAt': DateTime.now().toUtc().subtract(const Duration(days: 1)).toIso8601String(),
      'expiresAt': DateTime.now().toUtc().add(const Duration(days: 13)).toIso8601String(),
      'createdAt': DateTime.now().toUtc().subtract(const Duration(days: 1)).toIso8601String(),
      'updatedAt': DateTime.now().toUtc().toIso8601String(),
    },
    {
      '_id': 'inv_002',
      'matchResultId': 'match_002',
      'submissionId': 'pitch_001',
      'entrepreneurId': 'user_entrepreneur_001',
      'investorId': 'user_investor_002',
      'senderId': 'user_entrepreneur_001',
      'receiverId': 'user_investor_002',
      'message': 'Happy to share more details. Interested in a quick call?',
      'responseMessage': 'Yes — let’s schedule a demo next week.',
      'status': 'accepted',
      'sentAt': DateTime.now().toUtc().subtract(const Duration(days: 7)).toIso8601String(),
      'respondedAt': DateTime.now().toUtc().subtract(const Duration(days: 6)).toIso8601String(),
      'expiresAt': DateTime.now().toUtc().add(const Duration(days: 7)).toIso8601String(),
      'createdAt': DateTime.now().toUtc().subtract(const Duration(days: 7)).toIso8601String(),
      'updatedAt': DateTime.now().toUtc().subtract(const Duration(days: 6)).toIso8601String(),
    },
  ];

  @override
  Future<List<InvitationModel>> listMine({String? status, String? direction}) async {
    if (ApiConfig.useMockData) {
      await Future<void>.delayed(ApiConfig.mockLatency);
      var list = _mockInvitations.map((e) => InvitationModel.fromJson(e)).toList();
      if (status != null && status.isNotEmpty) {
        list = list.where((i) => i.status.name == status).toList();
      }
      // direction is ignored in mock mode but preserved for API compatibility.
      return list;
    }
    try {
      final res = await _dio.get(
        ApiConfig.invitationsMe,
        queryParameters: {
          if (status != null && status.isNotEmpty) 'status': status,
          if (direction != null && direction.isNotEmpty) 'direction': direction,
        },
      );
      if (res.statusCode == 200) {
        final data = res.data;
        final list = data is Map<String, dynamic>
            ? ((data['invitations'] as List?) ??
                (data['data'] as List?) ??
                const [])
            : (data as List? ?? const []);
        return list
            .whereType<Map>()
            .map((e) => InvitationModel.fromJson(e.cast<String, dynamic>()))
            .toList();
      }
      throw ServerFailure(message: 'Failed (HTTP ${res.statusCode})');
    } on DioException catch (e) {
      throw ServerFailure(message: e.message ?? 'Failed to load invitations');
    }
  }

  @override
  Future<InvitationModel> respond({
    required String invitationId,
    required String status,
    String? responseMessage,
  }) async {
    if (ApiConfig.useMockData) {
      await Future<void>.delayed(ApiConfig.mockLatency);
      final idx = _mockInvitations.indexWhere((i) => i['_id'] == invitationId || i['id'] == invitationId);
      final now = DateTime.now().toUtc();
      if (idx != -1) {
        final updated = Map<String, dynamic>.from(_mockInvitations[idx]);
        updated['status'] = status;
        if (responseMessage != null && responseMessage.isNotEmpty) {
          updated['responseMessage'] = responseMessage;
        }
        updated['respondedAt'] = now.toIso8601String();
        updated['updatedAt'] = now.toIso8601String();
        _mockInvitations[idx] = updated;
        return InvitationModel.fromJson(updated);
      }
      return InvitationModel.fromJson({
        '_id': invitationId,
        'matchResultId': 'match_001',
        'submissionId': 'pitch_002',
        'entrepreneurId': 'user_entrepreneur_001',
        'investorId': 'user_investor_001',
        'senderId': 'user_investor_001',
        'receiverId': 'user_entrepreneur_001',
        'status': status,
        if (responseMessage != null && responseMessage.isNotEmpty)
          'responseMessage': responseMessage,
        'sentAt': now.subtract(const Duration(days: 1)).toIso8601String(),
        'respondedAt': now.toIso8601String(),
        'expiresAt': now.add(const Duration(days: 14)).toIso8601String(),
        'createdAt': now.subtract(const Duration(days: 1)).toIso8601String(),
        'updatedAt': now.toIso8601String(),
      });
    }
    try {
      final res = await _dio.patch(
        ApiConfig.invitationRespond(invitationId),
        data: {
          'status': status,
          if (responseMessage != null && responseMessage.isNotEmpty)
            'responseMessage': responseMessage,
        },
      );
      if (res.statusCode == 200) {
        final data = res.data as Map<String, dynamic>;
        final inv =
            (data['invitation'] as Map?)?.cast<String, dynamic>() ?? data;
        return InvitationModel.fromJson(inv);
      }
      throw const ServerFailure(message: 'Failed to respond');
    } on DioException catch (e) {
      throw ServerFailure(message: e.message ?? 'Failed to respond');
    }
  }

  @override
  Future<InvitationModel> cancel(String invitationId) async {
    if (ApiConfig.useMockData) {
      await Future<void>.delayed(ApiConfig.mockLatency);
      final idx = _mockInvitations.indexWhere((i) => i['_id'] == invitationId || i['id'] == invitationId);
      final now = DateTime.now().toUtc();
      if (idx != -1) {
        final updated = Map<String, dynamic>.from(_mockInvitations[idx]);
        updated['status'] = 'cancelled';
        updated['updatedAt'] = now.toIso8601String();
        _mockInvitations[idx] = updated;
        return InvitationModel.fromJson(updated);
      }
      return InvitationModel.fromJson({
        '_id': invitationId,
        'matchResultId': 'match_001',
        'submissionId': 'pitch_002',
        'entrepreneurId': 'user_entrepreneur_001',
        'investorId': 'user_investor_001',
        'senderId': 'user_entrepreneur_001',
        'receiverId': 'user_investor_001',
        'status': 'cancelled',
        'sentAt': now.subtract(const Duration(days: 1)).toIso8601String(),
        'expiresAt': now.add(const Duration(days: 14)).toIso8601String(),
        'createdAt': now.subtract(const Duration(days: 1)).toIso8601String(),
        'updatedAt': now.toIso8601String(),
      });
    }
    try {
      final res = await _dio.patch(ApiConfig.invitationCancel(invitationId));
      if (res.statusCode == 200) {
        final data = res.data as Map<String, dynamic>;
        final inv =
            (data['invitation'] as Map?)?.cast<String, dynamic>() ?? data;
        return InvitationModel.fromJson(inv);
      }
      throw const ServerFailure(message: 'Failed to cancel');
    } on DioException catch (e) {
      throw ServerFailure(message: e.message ?? 'Failed to cancel');
    }
  }
}

