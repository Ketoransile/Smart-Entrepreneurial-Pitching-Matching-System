import 'dart:developer' as developer;

class AppLogger {
  AppLogger._();

  static void info(String message, {Object? error, StackTrace? stackTrace}) {
    developer.log(message,
        name: 'SEPMS', level: 800, error: error, stackTrace: stackTrace);
  }

  static void warn(String message, {Object? error, StackTrace? stackTrace}) {
    developer.log(message,
        name: 'SEPMS', level: 900, error: error, stackTrace: stackTrace);
  }

  static void error(String message, {Object? error, StackTrace? stackTrace}) {
    developer.log(message,
        name: 'SEPMS', level: 1000, error: error, stackTrace: stackTrace);
  }
}
