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
import '../../features/user_profile/data/datasources/user_profile_remote_datasource.dart';
import '../../features/user_profile/data/repositories/user_profile_repository_impl.dart';
import '../../features/user_profile/domain/repositories/user_profile_repository.dart';
import '../../features/user_profile/domain/usecases/get_my_profile_usecase.dart';
import '../../features/user_profile/presentation/bloc/user_profile_bloc.dart';
import '../../features/entrepreneur_profile/data/datasources/entrepreneur_profile_remote_datasource.dart';
import '../../features/entrepreneur_profile/data/repositories/entrepreneur_profile_repository_impl.dart';
import '../../features/entrepreneur_profile/domain/repositories/entrepreneur_profile_repository.dart';
import '../../features/entrepreneur_profile/domain/usecases/entrepreneur_profile_usecases.dart';
import '../../features/entrepreneur_profile/presentation/bloc/entrepreneur_profile_bloc.dart';
import '../../features/submissions/data/datasources/submissions_remote_datasource.dart';
import '../../features/submissions/data/repositories/submissions_repository_impl.dart';
import '../../features/submissions/domain/repositories/submissions_repository.dart';
import '../../features/submissions/domain/usecases/submissions_usecases.dart';
import '../../features/submissions/presentation/bloc/submissions_bloc.dart';
import '../../features/matching/data/datasources/matching_remote_datasource.dart';
import '../../features/matching/data/repositories/matching_repository_impl.dart';
import '../../features/matching/domain/repositories/matching_repository.dart';
import '../../features/matching/domain/usecases/matching_usecases.dart';
import '../../features/matching/presentation/bloc/matching_bloc.dart';
import '../../features/documents/data/datasources/documents_remote_datasource.dart';
import '../../features/documents/data/repositories/documents_repository_impl.dart';
import '../../features/documents/domain/repositories/documents_repository.dart';
import '../../features/documents/domain/usecases/documents_usecases.dart';
import '../../features/documents/presentation/bloc/documents_bloc.dart';
import '../../features/invitations/data/datasources/invitations_remote_datasource.dart';
import '../../features/invitations/data/repositories/invitations_repository_impl.dart';
import '../../features/invitations/domain/repositories/invitations_repository.dart';
import '../../features/invitations/domain/usecases/send_invitation_usecase.dart';
import '../../features/invitations/presentation/bloc/send_invitation_bloc.dart';
import '../../features/investor_profile/data/datasources/investor_profile_remote_datasource.dart';
import '../../features/investor_profile/data/repositories/investor_profile_repository_impl.dart';
import '../../features/investor_profile/domain/repositories/investor_profile_repository.dart';
import '../../features/investor_profile/domain/usecases/investor_profile_usecases.dart';
import '../../features/investor_profile/presentation/bloc/investor_profile_bloc.dart';
import '../../features/feed/data/datasources/feed_remote_datasource.dart';
import '../../features/feed/data/repositories/feed_repository_impl.dart';
import '../../features/feed/domain/repositories/feed_repository.dart';
import '../../features/feed/domain/usecases/feed_usecases.dart';
import '../../features/feed/presentation/bloc/feed_bloc.dart';
import '../../features/saved_pitches/data/datasources/saved_pitches_remote_datasource.dart';
import '../../features/saved_pitches/data/repositories/saved_pitches_repository_impl.dart';
import '../../features/saved_pitches/domain/repositories/saved_pitches_repository.dart';
import '../../features/saved_pitches/domain/usecases/saved_pitches_usecases.dart';
import '../../features/saved_pitches/presentation/bloc/saved_pitches_bloc.dart';
import '../../features/match_queue/data/datasources/match_queue_remote_datasource.dart';
import '../../features/match_queue/data/repositories/match_queue_repository_impl.dart';
import '../../features/match_queue/domain/repositories/match_queue_repository.dart';
import '../../features/match_queue/domain/usecases/match_queue_usecases.dart';
import '../../features/match_queue/presentation/bloc/match_queue_bloc.dart';
import '../../features/invitations/data/datasources/invitations_manage_remote_datasource.dart';
import '../../features/invitations/data/repositories/invitations_manage_repository_impl.dart';
import '../../features/invitations/domain/repositories/invitations_manage_repository.dart';
import '../../features/invitations/domain/usecases/invitations_manage_usecases.dart';
import '../../features/invitations/presentation/bloc/invitations_bloc.dart';
import '../../features/messaging/data/datasources/messaging_remote_datasource.dart';
import '../../features/messaging/data/repositories/messaging_repository_impl.dart';
import '../../features/messaging/domain/repositories/messaging_repository.dart';
import '../../features/messaging/domain/usecases/messaging_usecases.dart';
import '../../features/messaging/presentation/bloc/messaging_bloc.dart';
import '../../features/meetings/data/datasources/meetings_remote_datasource.dart';
import '../../features/meetings/data/repositories/meetings_repository_impl.dart';
import '../../features/meetings/domain/repositories/meetings_repository.dart';
import '../../features/meetings/domain/usecases/meetings_usecases.dart';
import '../../features/meetings/presentation/bloc/meetings_bloc.dart';
import '../../features/milestones/data/datasources/milestones_remote_datasource.dart';
import '../../features/milestones/data/repositories/milestones_repository_impl.dart';
import '../../features/milestones/domain/repositories/milestones_repository.dart';
import '../../features/milestones/domain/usecases/milestones_usecases.dart';
import '../../features/milestones/presentation/bloc/milestones_bloc.dart';
import '../../features/feedback/data/datasources/feedback_remote_datasource.dart';
import '../../features/feedback/data/repositories/feedback_repository_impl.dart';
import '../../features/feedback/domain/repositories/feedback_repository.dart';
import '../../features/feedback/domain/usecases/feedback_usecases.dart';
import '../../features/feedback/presentation/bloc/feedback_bloc.dart';

final sl = GetIt.instance;

Future<void> initDependencies() async {
  /// Registers external libraries, data sources, repositories, use-cases and BLoCs
  /// into the GetIt service locator. Call this once at app startup.
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

  sl.registerLazySingleton<UserProfileRemoteDataSource>(
    () => UserProfileRemoteDataSourceImpl(dioClient: sl<DioClient>()),
  );

  sl.registerLazySingleton<EntrepreneurProfileRemoteDataSource>(
    () => EntrepreneurProfileRemoteDataSourceImpl(dioClient: sl<DioClient>()),
  );

  sl.registerLazySingleton<SubmissionsRemoteDataSource>(
    () => SubmissionsRemoteDataSourceImpl(dioClient: sl<DioClient>()),
  );

  sl.registerLazySingleton<MatchingRemoteDataSource>(
    () => MatchingRemoteDataSourceImpl(dioClient: sl<DioClient>()),
  );

  sl.registerLazySingleton<DocumentsRemoteDataSource>(
    () => DocumentsRemoteDataSourceImpl(dioClient: sl<DioClient>()),
  );

  sl.registerLazySingleton<InvitationsRemoteDataSource>(
    () => InvitationsRemoteDataSourceImpl(dioClient: sl<DioClient>()),
  );

  sl.registerLazySingleton<InvitationsManageRemoteDataSource>(
    () => InvitationsManageRemoteDataSourceImpl(dioClient: sl<DioClient>()),
  );

  sl.registerLazySingleton<MessagingRemoteDataSource>(
    () => MessagingRemoteDataSourceImpl(dioClient: sl<DioClient>()),
  );

  sl.registerLazySingleton<MeetingsRemoteDataSource>(
    () => MeetingsRemoteDataSourceImpl(dioClient: sl<DioClient>()),
  );

  sl.registerLazySingleton<MilestonesRemoteDataSource>(
    () => MilestonesRemoteDataSourceImpl(dioClient: sl<DioClient>()),
  );

  sl.registerLazySingleton<FeedbackRemoteDataSource>(
    () => FeedbackRemoteDataSourceImpl(dioClient: sl<DioClient>()),
  );

  sl.registerLazySingleton<InvestorProfileRemoteDataSource>(
    () => InvestorProfileRemoteDataSourceImpl(dioClient: sl<DioClient>()),
  );

  sl.registerLazySingleton<FeedRemoteDataSource>(
    () => FeedRemoteDataSourceImpl(dioClient: sl<DioClient>()),
  );

  sl.registerLazySingleton<SavedPitchesRemoteDataSource>(
    () => SavedPitchesRemoteDataSourceImpl(dioClient: sl<DioClient>()),
  );

  sl.registerLazySingleton<MatchQueueRemoteDataSource>(
    () => MatchQueueRemoteDataSourceImpl(dioClient: sl<DioClient>()),
  );

  // Repositories
  sl.registerLazySingleton<AuthRepository>(
    () => AuthRepositoryImpl(
      remoteDataSource: sl<AuthRemoteDataSource>(),
      localDataSource: sl<AuthLocalDataSource>(),
    ),
  );

  sl.registerLazySingleton<UserProfileRepository>(
    () => UserProfileRepositoryImpl(remote: sl<UserProfileRemoteDataSource>()),
  );

  sl.registerLazySingleton<EntrepreneurProfileRepository>(
    () => EntrepreneurProfileRepositoryImpl(
      remote: sl<EntrepreneurProfileRemoteDataSource>(),
    ),
  );

  sl.registerLazySingleton<SubmissionsRepository>(
    () => SubmissionsRepositoryImpl(remote: sl<SubmissionsRemoteDataSource>()),
  );

  sl.registerLazySingleton<MatchingRepository>(
    () => MatchingRepositoryImpl(remote: sl<MatchingRemoteDataSource>()),
  );

  sl.registerLazySingleton<DocumentsRepository>(
    () => DocumentsRepositoryImpl(remote: sl<DocumentsRemoteDataSource>()),
  );

  sl.registerLazySingleton<InvitationsRepository>(
    () => InvitationsRepositoryImpl(remote: sl<InvitationsRemoteDataSource>()),
  );

  sl.registerLazySingleton<InvitationsManageRepository>(
    () => InvitationsManageRepositoryImpl(
      remote: sl<InvitationsManageRemoteDataSource>(),
    ),
  );

  sl.registerLazySingleton<MessagingRepository>(
    () => MessagingRepositoryImpl(remote: sl<MessagingRemoteDataSource>()),
  );

  sl.registerLazySingleton<MeetingsRepository>(
    () => MeetingsRepositoryImpl(remote: sl<MeetingsRemoteDataSource>()),
  );

  sl.registerLazySingleton<MilestonesRepository>(
    () => MilestonesRepositoryImpl(remote: sl<MilestonesRemoteDataSource>()),
  );

  sl.registerLazySingleton<FeedbackRepository>(
    () => FeedbackRepositoryImpl(remote: sl<FeedbackRemoteDataSource>()),
  );

  sl.registerLazySingleton<InvestorProfileRepository>(
    () => InvestorProfileRepositoryImpl(remote: sl<InvestorProfileRemoteDataSource>()),
  );

  sl.registerLazySingleton<FeedRepository>(
    () => FeedRepositoryImpl(remote: sl<FeedRemoteDataSource>()),
  );

  sl.registerLazySingleton<SavedPitchesRepository>(
    () => SavedPitchesRepositoryImpl(remote: sl<SavedPitchesRemoteDataSource>()),
  );

  sl.registerLazySingleton<MatchQueueRepository>(
    () => MatchQueueRepositoryImpl(remote: sl<MatchQueueRemoteDataSource>()),
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

  sl.registerLazySingleton(() => GetMyProfileUseCase(sl<UserProfileRepository>()));

  sl.registerLazySingleton(
    () => HasEntrepreneurProfileUseCase(sl<EntrepreneurProfileRepository>()),
  );
  sl.registerLazySingleton(
    () => GetEntrepreneurProfileUseCase(sl<EntrepreneurProfileRepository>()),
  );
  sl.registerLazySingleton(
    () => CreateEntrepreneurProfileUseCase(sl<EntrepreneurProfileRepository>()),
  );
  sl.registerLazySingleton(
    () => UpdateEntrepreneurProfileUseCase(sl<EntrepreneurProfileRepository>()),
  );

  sl.registerLazySingleton(() => ListMySubmissionsUseCase(sl<SubmissionsRepository>()));
  sl.registerLazySingleton(() => CreateDraftUseCase(sl<SubmissionsRepository>()));
  sl.registerLazySingleton(() => UpdateDraftUseCase(sl<SubmissionsRepository>()));
  sl.registerLazySingleton(() => DeleteDraftUseCase(sl<SubmissionsRepository>()));
  sl.registerLazySingleton(() => SubmitPitchUseCase(sl<SubmissionsRepository>()));
  sl.registerLazySingleton(() => CompletenessUseCase(sl<SubmissionsRepository>()));

  sl.registerLazySingleton(() => RunMatchingUseCase(sl<MatchingRepository>()));
  sl.registerLazySingleton(() => GetMatchResultsUseCase(sl<MatchingRepository>()));

  sl.registerLazySingleton(() => ListMyDocumentsUseCase(sl<DocumentsRepository>()));
  sl.registerLazySingleton(() => UploadDocumentUseCase(sl<DocumentsRepository>()));
  sl.registerLazySingleton(() => DeleteDocumentUseCase(sl<DocumentsRepository>()));
  sl.registerLazySingleton(
    () => DocumentValidationStatusUseCase(sl<DocumentsRepository>()),
  );

  sl.registerLazySingleton(() => SendInvitationUseCase(sl<InvitationsRepository>()));

  sl.registerLazySingleton(
    () => ListMyInvitationsUseCase(sl<InvitationsManageRepository>()),
  );
  sl.registerLazySingleton(
    () => RespondToInvitationUseCase(sl<InvitationsManageRepository>()),
  );
  sl.registerLazySingleton(
    () => CancelInvitationUseCase(sl<InvitationsManageRepository>()),
  );

  sl.registerLazySingleton(() => ListConversationsUseCase(sl<MessagingRepository>()));
  sl.registerLazySingleton(() => ListMessagesUseCase(sl<MessagingRepository>()));
  sl.registerLazySingleton(() => SendMessageUseCase(sl<MessagingRepository>()));
  sl.registerLazySingleton(() => MarkConversationReadUseCase(sl<MessagingRepository>()));
  sl.registerLazySingleton(() => UnreadCountUseCase(sl<MessagingRepository>()));
  sl.registerLazySingleton(() => ListNotificationsUseCase(sl<MessagingRepository>()));
  sl.registerLazySingleton(() => MarkNotificationReadUseCase(sl<MessagingRepository>()));

  sl.registerLazySingleton(() => ListMeetingsUseCase(sl<MeetingsRepository>()));
  sl.registerLazySingleton(() => ScheduleMeetingUseCase(sl<MeetingsRepository>()));
  sl.registerLazySingleton(() => UpdateMeetingStatusUseCase(sl<MeetingsRepository>()));

  sl.registerLazySingleton(() => ListMilestonesUseCase(sl<MilestonesRepository>()));
  sl.registerLazySingleton(() => CreateMilestoneUseCase(sl<MilestonesRepository>()));
  sl.registerLazySingleton(() => UpdateMilestoneUseCase(sl<MilestonesRepository>()));
  sl.registerLazySingleton(() => SubmitMilestoneEvidenceUseCase(sl<MilestonesRepository>()));
  sl.registerLazySingleton(() => VerifyMilestoneUseCase(sl<MilestonesRepository>()));

  sl.registerLazySingleton(() => SubmitFeedbackUseCase(sl<FeedbackRepository>()));
  sl.registerLazySingleton(() => ListReceivedFeedbackUseCase(sl<FeedbackRepository>()));
  sl.registerLazySingleton(() => ListGivenFeedbackUseCase(sl<FeedbackRepository>()));
  sl.registerLazySingleton(() => FeedbackSummaryUseCase(sl<FeedbackRepository>()));

  sl.registerLazySingleton(() => GetInvestorProfileUseCase(sl<InvestorProfileRepository>()));
  sl.registerLazySingleton(() => CreateInvestorProfileUseCase(sl<InvestorProfileRepository>()));
  sl.registerLazySingleton(() => UpdateInvestorProfileUseCase(sl<InvestorProfileRepository>()));

  sl.registerLazySingleton(() => BrowseFeedUseCase(sl<FeedRepository>()));
  sl.registerLazySingleton(() => GetPitchUseCase(sl<FeedRepository>()));

  sl.registerLazySingleton(() => ListSavedPitchesUseCase(sl<SavedPitchesRepository>()));
  sl.registerLazySingleton(() => ToggleSavedPitchUseCase(sl<SavedPitchesRepository>()));

  sl.registerLazySingleton(() => ListMatchQueueUseCase(sl<MatchQueueRepository>()));
  sl.registerLazySingleton(() => UpdateMatchStatusUseCase(sl<MatchQueueRepository>()));

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

  sl.registerFactory<UserProfileBloc>(
    () => UserProfileBloc(getMyProfile: sl<GetMyProfileUseCase>()),
  );

  sl.registerFactory<EntrepreneurProfileBloc>(
    () => EntrepreneurProfileBloc(
      hasProfile: sl<HasEntrepreneurProfileUseCase>(),
      getProfile: sl<GetEntrepreneurProfileUseCase>(),
      create: sl<CreateEntrepreneurProfileUseCase>(),
      update: sl<UpdateEntrepreneurProfileUseCase>(),
    ),
  );

  sl.registerFactory<SubmissionsBloc>(
    () => SubmissionsBloc(
      list: sl<ListMySubmissionsUseCase>(),
      create: sl<CreateDraftUseCase>(),
      update: sl<UpdateDraftUseCase>(),
      delete: sl<DeleteDraftUseCase>(),
      submit: sl<SubmitPitchUseCase>(),
      completeness: sl<CompletenessUseCase>(),
    ),
  );

  sl.registerFactory<MatchingBloc>(
    () => MatchingBloc(
      run: sl<RunMatchingUseCase>(),
      getResults: sl<GetMatchResultsUseCase>(),
    ),
  );

  sl.registerFactory<DocumentsBloc>(
    () => DocumentsBloc(
      list: sl<ListMyDocumentsUseCase>(),
      upload: sl<UploadDocumentUseCase>(),
      delete: sl<DeleteDocumentUseCase>(),
      validation: sl<DocumentValidationStatusUseCase>(),
    ),
  );

  sl.registerFactory<SendInvitationBloc>(
    () => SendInvitationBloc(send: sl<SendInvitationUseCase>()),
  );

  sl.registerFactory<InvitationsBloc>(
    () => InvitationsBloc(
      list: sl<ListMyInvitationsUseCase>(),
      respond: sl<RespondToInvitationUseCase>(),
      cancel: sl<CancelInvitationUseCase>(),
    ),
  );

  sl.registerFactory<MessagingBloc>(
    () => MessagingBloc(
      listConversations: sl<ListConversationsUseCase>(),
      listMessages: sl<ListMessagesUseCase>(),
      sendMessage: sl<SendMessageUseCase>(),
      markRead: sl<MarkConversationReadUseCase>(),
      unreadCount: sl<UnreadCountUseCase>(),
      listNotifications: sl<ListNotificationsUseCase>(),
      markNotificationRead: sl<MarkNotificationReadUseCase>(),
    ),
  );

  sl.registerFactory<MeetingsBloc>(
    () => MeetingsBloc(
      list: sl<ListMeetingsUseCase>(),
      schedule: sl<ScheduleMeetingUseCase>(),
      update: sl<UpdateMeetingStatusUseCase>(),
    ),
  );

  sl.registerFactory<MilestonesBloc>(
    () => MilestonesBloc(
      list: sl<ListMilestonesUseCase>(),
      create: sl<CreateMilestoneUseCase>(),
      update: sl<UpdateMilestoneUseCase>(),
      evidence: sl<SubmitMilestoneEvidenceUseCase>(),
      verify: sl<VerifyMilestoneUseCase>(),
    ),
  );

  sl.registerFactory<FeedbackBloc>(
    () => FeedbackBloc(
      submit: sl<SubmitFeedbackUseCase>(),
      received: sl<ListReceivedFeedbackUseCase>(),
      given: sl<ListGivenFeedbackUseCase>(),
      summary: sl<FeedbackSummaryUseCase>(),
    ),
  );

  sl.registerFactory<InvestorProfileBloc>(
    () => InvestorProfileBloc(
      get: sl<GetInvestorProfileUseCase>(),
      create: sl<CreateInvestorProfileUseCase>(),
      update: sl<UpdateInvestorProfileUseCase>(),
    ),
  );

  sl.registerFactory<FeedBloc>(
    () => FeedBloc(
      browse: sl<BrowseFeedUseCase>(),
      getPitch: sl<GetPitchUseCase>(),
    ),
  );

  sl.registerFactory<SavedPitchesBloc>(
    () => SavedPitchesBloc(
      list: sl<ListSavedPitchesUseCase>(),
      toggle: sl<ToggleSavedPitchUseCase>(),
    ),
  );

  sl.registerFactory<MatchQueueBloc>(
    () => MatchQueueBloc(
      list: sl<ListMatchQueueUseCase>(),
      update: sl<UpdateMatchStatusUseCase>(),
    ),
  );
}
