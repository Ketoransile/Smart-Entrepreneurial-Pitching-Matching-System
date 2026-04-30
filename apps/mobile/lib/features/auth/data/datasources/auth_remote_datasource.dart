import 'package:dio/dio.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'dart:async';
import '../../../../core/config/api_config.dart';
import '../../../../core/config/urls.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/mock/mock_backend.dart';
import '../../../../core/network/dio_client.dart';
import '../../domain/entities/user_entity.dart';
import '../models/user_model.dart';
import 'dart:developer' as developer;

abstract class AuthRemoteDataSource {
  Future<UserModel> signUp({
    required String email,
    required String password,
    required String fullName,
    required UserRole role,
    String? companyName,
    String? fundName,
  });

  Future<UserModel> signIn({
    required String email,
    required String password,
  });

  Future<UserModel> signInWithGoogle({
    required UserRole role,
    String? companyName,
    String? fundName,
  });

  Future<void> signOut();

  Future<UserModel?> getCurrentUser();

  Future<void> resendEmailVerification();

  Future<UserModel> refreshUserProfile();

  Stream<User?> get authStateChanges;

  User? get currentFirebaseUser;

  Future<void> sendPasswordResetEmail(String email);
}

class AuthRemoteDataSourceImpl implements AuthRemoteDataSource {
  final FirebaseAuth _firebaseAuth;
  final GoogleSignIn _googleSignIn;
  final DioClient _dioClient;
  UserModel? _mockCurrentUser;

  AuthRemoteDataSourceImpl({
    FirebaseAuth? firebaseAuth,
    GoogleSignIn? googleSignIn,
    required DioClient dioClient,
  })  : _firebaseAuth = firebaseAuth ?? FirebaseAuth.instance,
        _googleSignIn = googleSignIn ?? GoogleSignIn(),
        _dioClient = dioClient;

  @override
  Stream<User?> get authStateChanges =>
      ApiConfig.useMockData ? const Stream<User?>.empty() : _firebaseAuth.authStateChanges();

  @override
  User? get currentFirebaseUser =>
      ApiConfig.useMockData ? null : _firebaseAuth.currentUser;

  @override
  Future<UserModel> signUp({
    required String email,
    required String password,
    required String fullName,
    required UserRole role,
    String? companyName,
    String? fundName,
  }) async {
    if (ApiConfig.useMockData) {
      await Future<void>.delayed(ApiConfig.mockLatency);
      _mockCurrentUser = _buildMockSignedInUser(
        email: email,
        fullName: fullName,
        role: role,
      );
      return _mockCurrentUser!;
    }
    try {
      final credential = await _firebaseAuth.createUserWithEmailAndPassword(
        email: email,
        password: password,
      );

      await credential.user?.updateDisplayName(fullName);
      await credential.user?.sendEmailVerification();

      final userProfile = await _registerWithBackend(
        fullName: fullName,
        role: role,
        companyName: companyName,
        fundName: fundName,
      );

      return userProfile;
    } on FirebaseAuthException catch (e) {
      throw AuthFailure.fromFirebaseCode(e.code);
    } catch (e) {
      throw AuthFailure(message: e.toString());
    }
  }

  @override
  Future<UserModel> signIn({
    required String email,
    required String password,
  }) async {
    if (ApiConfig.useMockData) {
      await Future<void>.delayed(ApiConfig.mockLatency);
      final trimmedEmail = email.trim();
      final role = _mockRoleFromSignInEmail(trimmedEmail);
      _mockCurrentUser = _buildMockSignedInUser(
        email: trimmedEmail,
        fullName:
            role == UserRole.investor ? 'Demo Investor' : 'Demo Entrepreneur',
        role: role,
      );
      return _mockCurrentUser!;
    }
    try {
      await _firebaseAuth.signInWithEmailAndPassword(
        email: email,
        password: password,
      );

      final profile = await _fetchUserProfile();
      if (profile == null) {
        throw const AuthFailure(message: 'User profile not found');
      }
      return profile;
    } on FirebaseAuthException catch (e) {
      throw AuthFailure.fromFirebaseCode(e.code);
    } catch (e) {
      if (e is AuthFailure) rethrow;
      throw AuthFailure(message: e.toString());
    }
  }

  @override
  Future<UserModel> signInWithGoogle({
    required UserRole role,
    String? companyName,
    String? fundName,
  }) async {
    if (ApiConfig.useMockData) {
      await Future<void>.delayed(ApiConfig.mockLatency);
      _mockCurrentUser = _buildMockSignedInUser(
        email: 'google.demo@sepms.app',
        fullName: role == UserRole.investor ? 'Demo Investor' : 'Demo Entrepreneur',
        role: role,
      );
      return _mockCurrentUser!;
    }
    try {
      final googleUser = await _googleSignIn.signIn();
      if (googleUser == null) {
        throw const AuthFailure(message: 'Google sign-in was cancelled');
      }

      final googleAuth = await googleUser.authentication;
      final credential = GoogleAuthProvider.credential(
        accessToken: googleAuth.accessToken,
        idToken: googleAuth.idToken,
      );

      await _firebaseAuth.signInWithCredential(credential);

      var userProfile = await _fetchUserProfile();

      if (userProfile == null) {
        userProfile = await _registerWithBackend(
          fullName: googleUser.displayName ?? 'User',
          role: role,
          companyName: companyName,
          fundName: fundName,
        );
      }

      return userProfile;
    } on FirebaseAuthException catch (e) {
      throw AuthFailure.fromFirebaseCode(e.code);
    } catch (e) {
      if (e is AuthFailure) rethrow;
      throw AuthFailure(message: e.toString());
    }
  }

  @override
  Future<void> signOut() async {
    if (ApiConfig.useMockData) {
      await Future<void>.delayed(ApiConfig.mockLatency);
      _mockCurrentUser = null;
      return;
    }
    try {
      await Future.wait([
        _firebaseAuth.signOut(),
        _googleSignIn.signOut(),
      ]);
    } catch (e) {
      throw AuthFailure(message: 'Failed to sign out: $e');
    }
  }

  @override
  Future<UserModel?> getCurrentUser() async {
    if (ApiConfig.useMockData) {
      await Future<void>.delayed(ApiConfig.mockLatency);
      return _mockCurrentUser;
    }
    if (_firebaseAuth.currentUser == null) {
      return null;
    }
    return _fetchUserProfile();
  }

  @override
  Future<void> resendEmailVerification() async {
    if (ApiConfig.useMockData) {
      await Future<void>.delayed(ApiConfig.mockLatency);
      return;
    }
    try {
      final user = _firebaseAuth.currentUser;
      if (user == null) {
        throw const AuthFailure(message: 'No user logged in');
      }
      await user.sendEmailVerification();
    } on FirebaseAuthException catch (e) {
      throw AuthFailure.fromFirebaseCode(e.code);
    } catch (e) {
      if (e is AuthFailure) rethrow;
      throw AuthFailure(message: e.toString());
    }
  }

  @override
  Future<UserModel> refreshUserProfile() async {
    if (ApiConfig.useMockData) {
      await Future<void>.delayed(ApiConfig.mockLatency);
      if (_mockCurrentUser == null) {
        throw const AuthFailure(message: 'No user logged in');
      }
      _mockCurrentUser = UserModel.fromJson({
        ..._mockCurrentUser!.toJson(),
        'emailVerified': true,
        'updatedAt': DateTime.now().toUtc().toIso8601String(),
      });
      return _mockCurrentUser!;
    }
    try {
      final user = _firebaseAuth.currentUser;
      if (user == null) {
        throw const AuthFailure(message: 'No user logged in');
      }

      await user.reload();

      final profile = await _fetchUserProfile();
      if (profile == null) {
        throw const AuthFailure(message: 'User profile not found');
      }
      return profile;
    } catch (e) {
      if (e is AuthFailure) rethrow;
      throw AuthFailure(message: e.toString());
    }
  }

  @override
  Future<void> sendPasswordResetEmail(String email) async {
    if (ApiConfig.useMockData) {
      await Future<void>.delayed(ApiConfig.mockLatency);
      return;
    }
    try {
      await _firebaseAuth.sendPasswordResetEmail(email: email);
    } on FirebaseAuthException catch (e) {
      throw AuthFailure.fromFirebaseCode(e.code);
    } catch (e) {
      throw AuthFailure(message: e.toString());
    }
  }

  /// Returns null if the backend has no profile yet (HTTP 404), for flows such
  /// as first-time Google sign-in that then call [_registerWithBackend].
  Future<UserModel?> _fetchUserProfile() async {
    try {
      if (ApiConfig.useMockData) {
        await Future<void>.delayed(ApiConfig.mockLatency);
        final fbUser = _firebaseAuth.currentUser;
        if (fbUser == null) return null;
        return MockBackend.mockUser(
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: fbUser.displayName,
          role: UserRole.entrepreneur,
        );
      }
      final response = await _dioClient.get(Urls.authMe);
      developer.log('GET ${Urls.authMe} status=${response.statusCode}',
          name: 'auth_remote_datasource');
      developer.log('GET ${Urls.authMe} data=${response.data}',
          name: 'auth_remote_datasource');

      if (response.statusCode == 200) {
        // Backend may return the user under different keys. Be tolerant
        // and try to locate a user object in common places.
        final resp = response.data;
        developer.log('Response type: ${resp.runtimeType}',
            name: 'auth_remote_datasource');
        if (resp is Map<String, dynamic>) {
          if (resp['user'] is Map<String, dynamic>) {
            return UserModel.fromJson(resp['user'] as Map<String, dynamic>);
          }

          // Handle case where backend returns a list of users instead of a single user
          if (resp['user'] is List && (resp['user'] as List).isNotEmpty) {
            final userList = resp['user'] as List;
            if (userList.first is Map) {
              developer.log('User is a list, extracting first element',
                  name: 'auth_remote_datasource');
              return UserModel.fromJson(
                  Map<String, dynamic>.from(userList.first as Map));
            }
          }

          if (resp.containsKey('data') &&
              resp['data'] is Map<String, dynamic>) {
            final data = resp['data'] as Map<String, dynamic>;
            if (data['user'] is Map<String, dynamic>) {
              return UserModel.fromJson(data['user'] as Map<String, dynamic>);
            }
            // Handle nested user list in data
            if (data['user'] is List && (data['user'] as List).isNotEmpty) {
              final userList = data['user'] as List;
              if (userList.first is Map) {
                developer.log('data.user is a list, extracting first element',
                    name: 'auth_remote_datasource');
                return UserModel.fromJson(
                    Map<String, dynamic>.from(userList.first as Map));
              }
            }
            if (data.containsKey('uid') || data.containsKey('email')) {
              return UserModel.fromJson(Map<String, dynamic>.from(data));
            }
          }

          // In some implementations the user object is returned at top-level.
          if (resp.containsKey('uid') || resp.containsKey('email')) {
            return UserModel.fromJson(Map<String, dynamic>.from(resp));
          }
        }

        // If we couldn't parse a user object, treat as server failure.
        developer.log('Unexpected /auth/me response shape',
            name: 'auth_remote_datasource', error: response.data);
        throw const ServerFailure(
            message: 'Unexpected /auth/me response shape');
      }

      if (response.statusCode == 404) {
        return null;
      }

      throw ServerFailure(
        message: 'Failed to load profile (HTTP ${response.statusCode})',
      );
    } on DioException catch (e) {
      developer.log('DioException when fetching /auth/me',
          name: 'auth_remote_datasource', error: e, stackTrace: e.stackTrace);
      // Network or server error encountered while fetching the profile.
      // Convert Dio exceptions into domain failures for higher layers.
      if (e.type == DioExceptionType.connectionTimeout ||
          e.type == DioExceptionType.sendTimeout ||
          e.type == DioExceptionType.receiveTimeout ||
          e.type == DioExceptionType.connectionError) {
        throw const NetworkFailure();
      }
      final status = e.response?.statusCode;
      if (status == 404) {
        developer.log('/auth/me returned 404', name: 'auth_remote_datasource');
        return null;
      }
      if (status == 401 || status == 403) {
        throw const AuthFailure(
          message: 'Session expired or not authorized. Please sign in again.',
        );
      }
      throw ServerFailure(
        message: e.message ?? 'Could not reach the server',
      );
    } catch (e) {
      developer.log('Unexpected error in _fetchUserProfile',
          name: 'auth_remote_datasource', error: e);
      if (e is AuthFailure || e is NetworkFailure || e is ServerFailure) {
        rethrow;
      }
      throw ServerFailure(message: e.toString());
    }
  }

  Future<UserModel> _registerWithBackend({
    required String fullName,
    required UserRole role,
    String? companyName,
    String? fundName,
  }) async {
    try {
      if (ApiConfig.useMockData) {
        await Future<void>.delayed(ApiConfig.mockLatency);
        final fbUser = _firebaseAuth.currentUser;
        final uid = fbUser?.uid ?? 'user_mock_${DateTime.now().millisecondsSinceEpoch}';
        return MockBackend.mockUser(
          uid: uid,
          email: fbUser?.email,
          displayName: fullName,
          role: role,
        );
      }
      final response = await _dioClient.post(
        Urls.authRegister,
        data: {
          'fullName': fullName,
          'role': role.name,
          if (companyName != null && companyName.isNotEmpty)
            'companyName': companyName,
          if (fundName != null && fundName.isNotEmpty) 'fundName': fundName,
        },
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        final resp = response.data;
        developer.log('POST ${Urls.authRegister} status=${response.statusCode}',
            name: 'auth_remote_datasource');
        developer.log('POST ${Urls.authRegister} data=${resp}',
            name: 'auth_remote_datasource');
        developer.log('Register response type: ${resp.runtimeType}',
            name: 'auth_remote_datasource');
        if (resp is Map<String, dynamic>) {
          // Look for common keys where the backend may place the user object.
          if (resp['user'] is Map<String, dynamic>) {
            return UserModel.fromJson(resp['user'] as Map<String, dynamic>);
          }

          // Handle case where user is returned as a list
          if (resp['user'] is List && (resp['user'] as List).isNotEmpty) {
            final userList = resp['user'] as List;
            if (userList.first is Map) {
              developer.log(
                  'Register: user is a list, extracting first element',
                  name: 'auth_remote_datasource');
              return UserModel.fromJson(
                  Map<String, dynamic>.from(userList.first as Map));
            }
          }

          if (resp.containsKey('data') &&
              resp['data'] is Map<String, dynamic>) {
            final data = resp['data'] as Map<String, dynamic>;
            if (data['user'] is Map<String, dynamic>) {
              return UserModel.fromJson(data['user'] as Map<String, dynamic>);
            }
            // Handle nested user list in data
            if (data['user'] is List && (data['user'] as List).isNotEmpty) {
              final userList = data['user'] as List;
              if (userList.first is Map) {
                developer.log(
                    'Register data.user is a list, extracting first element',
                    name: 'auth_remote_datasource');
                return UserModel.fromJson(
                    Map<String, dynamic>.from(userList.first as Map));
              }
            }
            if (data.containsKey('uid') || data.containsKey('email')) {
              return UserModel.fromJson(Map<String, dynamic>.from(data));
            }
          }

          // If backend returned the created user at top-level, accept it.
          if (resp.containsKey('uid') || resp.containsKey('email')) {
            return UserModel.fromJson(Map<String, dynamic>.from(resp));
          }

          // Some backends return only a message/status; surface that message.
          final msg =
              resp['message'] is String ? resp['message'] as String : null;
          developer.log('Registration response missing user object',
              name: 'auth_remote_datasource', error: resp);
          throw AuthFailure(message: msg ?? 'Failed to register with backend');
        }

        throw const AuthFailure(
            message: 'Invalid response from registration endpoint');
      }

      throw const AuthFailure(message: 'Failed to register with backend');
    } catch (e) {
      if (e is AuthFailure) rethrow;
      throw AuthFailure(message: 'Failed to register: $e');
    }
  }

  /// Mock email/password login: treat `investor@...` (local part exactly
  /// `investor`) as investor; otherwise entrepreneur.
  static UserRole _mockRoleFromSignInEmail(String email) {
    final lower = email.toLowerCase().trim();
    final at = lower.indexOf('@');
    if (at <= 0) return UserRole.entrepreneur;
    var local = lower.substring(0, at);
    final plus = local.indexOf('+');
    if (plus >= 0) local = local.substring(0, plus);
    if (local == 'investor') return UserRole.investor;
    return UserRole.entrepreneur;
  }

  static String _mockStableUidForRole(UserRole role, String email) {
    switch (role) {
      case UserRole.investor:
        return 'user_investor_001';
      case UserRole.entrepreneur:
        return 'user_entrepreneur_001';
      case UserRole.admin:
        return 'mock_auth_${email.hashCode.abs()}';
    }
  }

  UserModel _buildMockSignedInUser({
    required String email,
    required String fullName,
    required UserRole role,
  }) {
    final base = MockBackend.mockUser(
      uid: _mockStableUidForRole(role, email),
      email: email,
      displayName: fullName,
      role: role,
    );
    return UserModel.fromJson({
      ...base.toJson(),
      'emailVerified': true,
      'status': 'verified',
      'isActive': true,
      'updatedAt': DateTime.now().toUtc().toIso8601String(),
    });
  }
}
