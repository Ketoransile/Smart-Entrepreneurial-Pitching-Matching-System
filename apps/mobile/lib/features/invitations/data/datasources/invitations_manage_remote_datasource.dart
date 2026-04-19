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

  @override
  Future<List<InvitationModel>> listMine({String? status, String? direction}) async {
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

