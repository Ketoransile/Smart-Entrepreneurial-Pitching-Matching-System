import 'package:dio/dio.dart';

import '../../../../core/config/api_config.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/network/dio_client.dart';
import '../models/invitation_model.dart';

abstract class InvitationsRemoteDataSource {
  Future<InvitationModel> sendInvitation({
    required String matchId,
    required String message,
    int? expiresInDays,
  });
}

class InvitationsRemoteDataSourceImpl implements InvitationsRemoteDataSource {
  final DioClient _dio;
  InvitationsRemoteDataSourceImpl({required DioClient dioClient}) : _dio = dioClient;

  @override
  Future<InvitationModel> sendInvitation({
    required String matchId,
    required String message,
    int? expiresInDays,
  }) async {
    if (ApiConfig.useMockData) {
      await Future<void>.delayed(ApiConfig.mockLatency);
      final now = DateTime.now().toUtc();
      return InvitationModel.fromJson({
        '_id': 'inv_${now.millisecondsSinceEpoch}',
        'matchResultId': matchId,
        'submissionId': 'pitch_002',
        'entrepreneurId': 'user_entrepreneur_001',
        'investorId': 'user_investor_001',
        'senderId': 'user_investor_001',
        'receiverId': 'user_entrepreneur_001',
        'message': message,
        'status': 'pending',
        'sentAt': now.toIso8601String(),
        'expiresAt':
            now.add(Duration(days: expiresInDays ?? 14)).toIso8601String(),
        'createdAt': now.toIso8601String(),
        'updatedAt': now.toIso8601String(),
      });
    }
    try {
      final res = await _dio.post(
        ApiConfig.invitations,
        data: {
          'matchId': matchId,
          'message': message,
          if (expiresInDays != null) 'expiresInDays': expiresInDays,
        },
      );
      if (res.statusCode == 201 || res.statusCode == 200) {
        final data = res.data as Map<String, dynamic>;
        final inv = (data['invitation'] as Map?)?.cast<String, dynamic>() ?? data;
        return InvitationModel.fromJson(inv);
      }
      throw const ServerFailure(message: 'Failed to send invitation');
    } on DioException catch (e) {
      final status = e.response?.statusCode;
      if (status == 401 || status == 403) {
        throw const AuthFailure(message: 'Not authorized');
      }
      throw ServerFailure(message: e.message ?? 'Failed to send invitation');
    }
  }
}

