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

  static final List<Map<String, dynamic>> _mockDocs = [
    {
      '_id': 'doc_001',
      'ownerId': 'user_entrepreneur_001',
      'submissionId': 'pitch_002',
      'type': 'pitch_deck',
      'filename': 'ClinicFlow Pitch Deck.pdf',
      'cloudinaryPublicId': 'mock/clinicflow_pitch_deck',
      'url': 'https://example.com/clinicflow_pitch_deck.pdf',
      'sizeBytes': 345678,
      'mimeType': 'application/pdf',
      'status': 'processed',
      'aiSummary':
          'Clinic operations platform for rural clinics with measurable traction and clear go-to-market.',
      'aiTags': ['health', 'workflow', 'mobile'],
      'aiConfidence': 0.87,
      'processedAt': DateTime.now().toUtc().subtract(const Duration(days: 1)).toIso8601String(),
      'createdAt': DateTime.now().toUtc().subtract(const Duration(days: 4)).toIso8601String(),
      'updatedAt': DateTime.now().toUtc().toIso8601String(),
    },
  ];

  @override
  Future<List<DocumentModel>> listMyDocuments() async {
    if (ApiConfig.useMockData) {
      await Future<void>.delayed(ApiConfig.mockLatency);
      return _mockDocs.map((e) => DocumentModel.fromJson(e)).toList();
    }
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
    if (ApiConfig.useMockData) {
      await Future<void>.delayed(ApiConfig.mockLatency);
      final now = DateTime.now().toUtc();
      final id = 'doc_${100 + _mockDocs.length}';
      final doc = <String, dynamic>{
        '_id': id,
        'ownerId': 'user_entrepreneur_001',
        if (submissionId != null && submissionId.isNotEmpty)
          'submissionId': submissionId,
        'type': type,
        'filename': file.path.split(Platform.pathSeparator).last,
        'cloudinaryPublicId': 'mock/$id',
        'url': 'https://example.com/uploads/$id',
        'sizeBytes': file.lengthSync(),
        'mimeType': 'application/octet-stream',
        'status': 'uploaded',
        'aiTags': const <String>[],
        'createdAt': now.toIso8601String(),
        'updatedAt': now.toIso8601String(),
      };
      _mockDocs.insert(0, doc);
      return DocumentModel.fromJson(doc);
    }
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
    if (ApiConfig.useMockData) {
      await Future<void>.delayed(ApiConfig.mockLatency);
      _mockDocs.removeWhere((d) => d['_id'] == id || d['id'] == id);
      return;
    }
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
    if (ApiConfig.useMockData) {
      await Future<void>.delayed(ApiConfig.mockLatency);
      final doc = _mockDocs.firstWhere(
        (d) => d['_id'] == id || d['id'] == id,
        orElse: () => {'_id': id, 'status': 'processed'},
      );
      return {
        'documentId': id,
        'status': doc['status'] ?? 'processed',
        'isValid': true,
        'issues': const <String>[],
        'checkedAt': DateTime.now().toUtc().toIso8601String(),
      };
    }
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

