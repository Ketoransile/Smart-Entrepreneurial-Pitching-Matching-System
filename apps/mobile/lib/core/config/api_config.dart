import 'dart:io';

import 'package:flutter/foundation.dart';

class ApiConfig {
  ApiConfig._();

  static const String _configuredBaseUrl =
      String.fromEnvironment('API_BASE_URL', defaultValue: '');

  static String get baseUrl {
    if (_configuredBaseUrl.isNotEmpty) {
      return _configuredBaseUrl;
    }
    if (kDebugMode) {
      if (Platform.isAndroid) {
        return 'http://10.0.2.2:5000/api';
      } else if (Platform.isIOS) {
        return 'http://localhost:5000/api';
      }
      return 'http://localhost:5000/api';
    }
    throw StateError(
      'API_BASE_URL must be provided via --dart-define in non-debug builds.',
    );
  }

  static const String register = '/auth/register';
  static const String me = '/auth/me';
  static const String role = '/auth/role';

  static const Duration connectTimeout = Duration(seconds: 30);
  static const Duration receiveTimeout = Duration(seconds: 30);
}
