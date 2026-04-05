import 'package:firebase_auth/firebase_auth.dart';
import 'package:get_it/get_it.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../network/dio_client.dart';
import '../../features/auth/data/datasources/auth_local_datasource.dart';
import '../../features/auth/data/datasources/auth_remote_datasource.dart';
import '../../features/auth/data/repositories/auth_repository_impl.dart';
import '../../features/auth/domain/repositories/auth_repository.dart';
import '../../features/auth/domain/usecases/usecases.dart';
import '../../features/auth/presentation/bloc/auth_bloc.dart';

final sl = GetIt.instance;

Future<void> initDependencies() async {
  // External
  final sharedPreferences = await SharedPreferences.getInstance();
  sl.registerLazySingleton<SharedPreferences>(() => sharedPreferences);
  sl.registerLazySingleton<FirebaseAuth>(() => FirebaseAuth.instance);
  sl.registerLazySingleton<GoogleSignIn>(() => GoogleSignIn());

  // Network
  sl.registerLazySingleton<DioClient>(
    () => DioClient(firebaseAuth: sl<FirebaseAuth>()),
  );

  // Data Sources
  sl.registerLazySingleton<AuthRemoteDataSource>(
    () => AuthRemoteDataSourceImpl(
      firebaseAuth: sl<FirebaseAuth>(),
      googleSignIn: sl<GoogleSignIn>(),
      dioClient: sl<DioClient>(),
    ),
  );

  sl.registerLazySingleton<AuthLocalDataSource>(
    () => AuthLocalDataSourceImpl(prefs: sl<SharedPreferences>()),
  );

  // Repositories
  sl.registerLazySingleton<AuthRepository>(
    () => AuthRepositoryImpl(
      remoteDataSource: sl<AuthRemoteDataSource>(),
      localDataSource: sl<AuthLocalDataSource>(),
    ),
  );

  // Use Cases
  sl.registerLazySingleton(() => SignInUseCase(sl<AuthRepository>()));
  sl.registerLazySingleton(() => SignUpUseCase(sl<AuthRepository>()));
  sl.registerLazySingleton(() => SignInWithGoogleUseCase(sl<AuthRepository>()));
  sl.registerLazySingleton(() => SignOutUseCase(sl<AuthRepository>()));
  sl.registerLazySingleton(() => GetCurrentUserUseCase(sl<AuthRepository>()));
  sl.registerLazySingleton(() => ResendVerificationUseCase(sl<AuthRepository>()));
  sl.registerLazySingleton(() => RefreshUserProfileUseCase(sl<AuthRepository>()));
  sl.registerLazySingleton(() => SendPasswordResetEmailUseCase(sl<AuthRepository>()));

  // BLoCs
  sl.registerFactory<AuthBloc>(
    () => AuthBloc(
      signIn: sl<SignInUseCase>(),
      signUp: sl<SignUpUseCase>(),
      signInWithGoogle: sl<SignInWithGoogleUseCase>(),
      signOut: sl<SignOutUseCase>(),
      getCurrentUser: sl<GetCurrentUserUseCase>(),
      resendVerification: sl<ResendVerificationUseCase>(),
      refreshUserProfile: sl<RefreshUserProfileUseCase>(),
      sendPasswordResetEmail: sl<SendPasswordResetEmailUseCase>(),
      authStateChanges: sl<AuthRepository>().authStateChanges,
    ),
  );
}
