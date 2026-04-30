import 'package:dio/dio.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';
import 'dart:developer' as developer;

import '../config/api_config.dart';

class DioClient {
  late final Dio _dio;
  final FirebaseAuth _firebaseAuth;

  DioClient({FirebaseAuth? firebaseAuth})
      : _firebaseAuth = firebaseAuth ?? FirebaseAuth.instance {
    _dio = Dio(
      BaseOptions(
        baseUrl: ApiConfig.baseUrl,
        connectTimeout: ApiConfig.connectTimeout,
        receiveTimeout: ApiConfig.receiveTimeout,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await _getFirebaseToken();
          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          // Safe debug: log whether the request has an auth header (do not log the token)
          try {
            final hasAuth = options.headers['Authorization'] != null;
            developer.log(
                'Outgoing ${options.method} ${options.path} auth=$hasAuth',
                name: 'DioClient');
          } catch (_) {}
          return handler.next(options);
        },
        onError: (error, handler) {
          return handler.next(error);
        },
      ),
    );

    if (kDebugMode) {
      _dio.interceptors.add(
        LogInterceptor(
          requestBody: true,
          responseBody: true,
          error: true,
          logPrint: (obj) {
            var line = obj.toString();
            line = line.replaceAll(
              RegExp(r'Bearer\s+[^\s]+', caseSensitive: false),
              'Bearer [REDACTED]',
            );
            debugPrint(line);
          },
        ),
      );
    }
  }

  Future<String?> _getFirebaseToken() async {
    /// Returns the current user's Firebase ID token, or null if unauthenticated.
    /// The token is attached to outgoing requests in the request interceptor.
    try {
      final user = _firebaseAuth.currentUser;
      if (user != null) {
        final token = await user.getIdToken();
        // Log presence and length only for debugging; don't print the token value.
        developer.log(
            'Firebase token fetched: present=true length=${token?.length ?? 0}',
            name: 'DioClient');
        return token;
      }
      return null;
    } catch (e) {
      developer.log('Error fetching Firebase token: $e',
          name: 'DioClient', error: e);
      return null;
    }
  }

  Dio get dio => _dio;

  Future<Response<T>> get<T>(
    String path, {
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) {
    return _dio.get<T>(
      path,
      queryParameters: queryParameters,
      options: options,
    );
  }

  Future<Response<T>> post<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) {
    return _dio.post<T>(
      path,
      data: data,
      queryParameters: queryParameters,
      options: options,
    );
  }

  Future<Response<T>> patch<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) {
    return _dio.patch<T>(
      path,
      data: data,
      queryParameters: queryParameters,
      options: options,
    );
  }

  Future<Response<T>> delete<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) {
    return _dio.delete<T>(
      path,
      data: data,
      queryParameters: queryParameters,
      options: options,
    );
  }

  Future<Response<T>> put<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) {
    return _dio.put<T>(
      path,
      data: data,
      queryParameters: queryParameters,
      options: options,
    );
  }
}
