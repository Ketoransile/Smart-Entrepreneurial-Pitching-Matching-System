import 'dart:io';

import 'package:dio/dio.dart';

import '../../../../core/config/api_config.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/network/dio_client.dart';
import '../models/document_model.dart';

abstract class DocumentsRemoteDataSource {
  Future<List<DocumentModel>> listMyDocuments();
  Future<DocumentModel> uploadDocument({
    required File file,
    required String type,
    String? submissionId,
  });
  Future<void> deleteDocument(String id);
  Future<Map<String, dynamic>> validationStatus(String id);
}

class DocumentsRemoteDataSourceImpl implements DocumentsRemoteDataSource {
  final DioClient _dio;
  DocumentsRemoteDataSourceImpl({required DioClient dioClient}) : _dio = dioClient;

  @override
  Future<List<DocumentModel>> listMyDocuments() async {
    try {
      final res = await _dio.get(ApiConfig.documents);
      if (res.statusCode == 200) {
        final data = res.data as Map<String, dynamic>;
        final list = (data['documents'] as List?) ?? (data['data'] as List?) ?? const [];
        return list
            .whereType<Map>()
            .map((e) => DocumentModel.fromJson(e.cast<String, dynamic>()))
            .toList();
      }
      throw ServerFailure(message: 'Failed (HTTP ${res.statusCode})');
    } on DioException catch (e) {
      throw ServerFailure(message: e.message ?? 'Failed to list documents');
    }
  }

  @override
  Future<DocumentModel> uploadDocument({
    required File file,
    required String type,
    String? submissionId,
  }) async {
    try {
      final form = FormData.fromMap({
        'file': await MultipartFile.fromFile(file.path),
        'type': type,
        if (submissionId != null && submissionId.isNotEmpty) 'submissionId': submissionId,
      });
      final res = await _dio.post(ApiConfig.documents, data: form);
      if (res.statusCode == 201 || res.statusCode == 200) {
        final data = res.data as Map<String, dynamic>;
        final doc = (data['document'] as Map?)?.cast<String, dynamic>() ?? data;
        return DocumentModel.fromJson(doc);
      }
      throw const ServerFailure(message: 'Upload failed');
    } on DioException catch (e) {
      final status = e.response?.statusCode;
      if (status == 401 || status == 403) {
        throw const AuthFailure(message: 'Not authorized');
      }
      throw ServerFailure(message: e.message ?? 'Upload failed');
    }
  }

  @override
  Future<void> deleteDocument(String id) async {
    try {
      final res = await _dio.delete(ApiConfig.documentById(id));
      if (res.statusCode == 200) return;
      throw ServerFailure(message: 'Failed (HTTP ${res.statusCode})');
    } on DioException catch (e) {
      throw ServerFailure(message: e.message ?? 'Delete failed');
    }
  }

  @override
  Future<Map<String, dynamic>> validationStatus(String id) async {
    try {
      final res = await _dio.get(ApiConfig.documentValidation(id));
      if (res.statusCode == 200) {
        return (res.data as Map).cast<String, dynamic>();
      }
      throw ServerFailure(message: 'Failed (HTTP ${res.statusCode})');
    } on DioException catch (e) {
      throw ServerFailure(message: e.message ?? 'Failed to load status');
    }
  }
}

