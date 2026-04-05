import 'dart:io';

class ApiConfig {
  ApiConfig._();

  static String get baseUrl {
    if (Platform.isAndroid) {
      return 'http://10.0.2.2:5000/api';
    } else if (Platform.isIOS) {
      return 'http://localhost:5000/api';
    }
    return 'http://localhost:5000/api';
  }

  static const String register = '/auth/register';
  static const String me = '/auth/me';
  static const String role = '/auth/role';

  static const Duration connectTimeout = Duration(seconds: 30);
  static const Duration receiveTimeout = Duration(seconds: 30);
}
