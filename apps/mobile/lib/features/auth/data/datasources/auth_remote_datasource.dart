import 'package:dio/dio.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:google_sign_in/google_sign_in.dart';
import '../../../../core/config/api_config.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/network/dio_client.dart';
import '../../domain/entities/user_entity.dart';
import '../models/user_model.dart';

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

  AuthRemoteDataSourceImpl({
    FirebaseAuth? firebaseAuth,
    GoogleSignIn? googleSignIn,
    required DioClient dioClient,
  })  : _firebaseAuth = firebaseAuth ?? FirebaseAuth.instance,
        _googleSignIn = googleSignIn ?? GoogleSignIn(),
        _dioClient = dioClient;

  @override
  Stream<User?> get authStateChanges => _firebaseAuth.authStateChanges();

  @override
  User? get currentFirebaseUser => _firebaseAuth.currentUser;

  @override
  Future<UserModel> signUp({
    required String email,
    required String password,
    required String fullName,
    required UserRole role,
    String? companyName,
    String? fundName,
  }) async {
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
    if (_firebaseAuth.currentUser == null) {
      return null;
    }
    return _fetchUserProfile();
  }

  @override
  Future<void> resendEmailVerification() async {
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
      final response = await _dioClient.get(ApiConfig.me);

      if (response.statusCode == 200) {
        final data = response.data as Map<String, dynamic>;
        return UserModel.fromJson(data['user'] as Map<String, dynamic>);
      }

      if (response.statusCode == 404) {
        return null;
      }

      throw ServerFailure(
        message: 'Failed to load profile (HTTP ${response.statusCode})',
      );
    } on DioException catch (e) {
      if (e.type == DioExceptionType.connectionTimeout ||
          e.type == DioExceptionType.sendTimeout ||
          e.type == DioExceptionType.receiveTimeout ||
          e.type == DioExceptionType.connectionError) {
        throw const NetworkFailure();
      }
      final status = e.response?.statusCode;
      if (status == 404) {
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
      final response = await _dioClient.post(
        ApiConfig.register,
        data: {
          'fullName': fullName,
          'role': role.name,
          if (companyName != null && companyName.isNotEmpty)
            'companyName': companyName,
          if (fundName != null && fundName.isNotEmpty) 'fundName': fundName,
        },
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = response.data as Map<String, dynamic>;
        return UserModel.fromJson(data['user'] as Map<String, dynamic>);
      }

      throw const AuthFailure(message: 'Failed to register with backend');
    } catch (e) {
      if (e is AuthFailure) rethrow;
      throw AuthFailure(message: 'Failed to register: $e');
    }
  }
}
