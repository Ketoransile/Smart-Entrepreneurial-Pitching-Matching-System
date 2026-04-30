import 'urls.dart';

class ApiConfig {
  ApiConfig._();

  /// When enabled, the app will bypass real HTTP calls in remote data-sources
  /// and return deterministic mock responses instead (useful for UI preview).
  ///
  /// **Mock email sign-in:** use an address whose local part (before `@`) is
  /// `investor`, e.g. `investor@test.com`, with any password to open the investor
  /// shell. Any other local part behaves as entrepreneur.
  static const bool useMockData = true;

  /// Artificial latency to better simulate real network calls in mock mode.
  static const Duration mockLatency = Duration(milliseconds: 350);

  /// Base URL for all API requests - centralized in Urls class
  static String get baseUrl => Urls.baseUrl;

  // ============================================================================
  // ENDPOINT SHORTCUTS - Delegate to Urls class for consistency
  // ============================================================================

  /// Auth endpoints
  static String get register => Urls.authRegister;
  static String get authMe => Urls.authMe;

  /// User endpoints
  static String get usersMe => Urls.updateUserProfile;
  static String get usersMeProfile => Urls.updateUserProfile;
  static String get usersMeAvatar => Urls.updateUserProfile;

  /// Entrepreneur endpoints
  static String get entrepreneurProfile => Urls.updateUserProfile;
  static String get entrepreneurProfileCheck => Urls.getUserProfile;

  /// Investor endpoints
  static String get investorProfile => Urls.updateInvestorProfile;
  static String get investorSavedPitches => Urls.getInvestorPortfolio;

  /// Pitch/Submission endpoints
  static String get submissions => Urls.listPitches;
  static String get submissionsFeedBrowse => Urls.listPitches;
  static String submissionById(String id) => Urls.buildUrl(Urls.getPitch, id);
  static String submissionSubmit(String id) =>
      Urls.buildUrl(Urls.submitPitch, id);
  static String submissionCompleteness(String id) =>
      Urls.buildUrl(Urls.getPitch, id);

  /// Matching endpoints
  static String matchingRun(String submissionId) =>
      Urls.buildUrl(Urls.createMatch, submissionId);
  static String matchingResults(String submissionId) =>
      Urls.buildUrl(Urls.getMatch, submissionId);
  static String get matchingInvestorQueue => Urls.getRecommendedPitches;
  static String matchingStatus(String matchId) =>
      Urls.buildUrl(Urls.updateMatchStatus, matchId);

  /// Invitation endpoints
  static String get invitations => Urls.createMatch;
  static String get invitationsMe => Urls.listMatches;
  static String invitationRespond(String invitationId) =>
      Urls.buildUrl(Urls.getMatch, invitationId);
  static String invitationCancel(String invitationId) =>
      Urls.buildUrl(Urls.getMatch, invitationId);

  /// Upload/Document endpoints
  static String get upload => Urls.uploadFile;
  static String uploadDelete(String publicId) =>
      Urls.buildUrl(Urls.deleteUploadedFile, publicId);
  static String get documents => Urls.listDocuments;
  static String documentById(String id) =>
      Urls.buildUrl(Urls.deleteDocument, id);
  static String documentValidation(String id) =>
      Urls.buildUrl(Urls.getDocumentValidation, id);

  /// Communication endpoints
  static String get meetings => Urls.listMeetings;
  static String meetingStatus(String meetingId) =>
      Urls.buildUrl(Urls.updateMeetingStatus, meetingId);
  static String get conversations => Urls.listConversations;
  static String conversationById(String conversationId) =>
      Urls.buildUrl(Urls.getConversationMessages, conversationId);
  static String conversationMessages(String conversationId) =>
      Urls.buildUrl(Urls.getConversationMessages, conversationId);
  static String conversationRead(String conversationId) =>
      Urls.buildUrl(Urls.getConversationMessages, conversationId);
  static String conversationReport(String conversationId) =>
      Urls.buildUrl(Urls.getConversationMessages, conversationId);
  static String get unreadCount => Urls.listNotifications;
  static String get notifications => Urls.listNotifications;
  static String notificationRead(String notificationId) =>
      Urls.buildUrl(Urls.markNotificationRead, notificationId);

  /// Feedback endpoints
  static String get feedback => Urls.submitFeedback;
  static String get feedbackReceived => Urls.getFeedbackReceived;
  static String get feedbackGiven => Urls.getFeedbackGiven;
  static String get feedbackSummary => Urls.getFeedbackSummary;

  /// Milestones endpoints
  static String get milestones => Urls.listMilestones;
  static String milestoneById(String id) =>
      Urls.buildUrl(Urls.updateMilestone, id);
  static String milestoneEvidence(String id) =>
      Urls.buildUrl(Urls.addMilestoneEvidence, id);
  static String milestoneVerify(String id) =>
      Urls.buildUrl(Urls.verifyMilestone, id);

  /// Connection timeouts
  static const Duration connectTimeout = Duration(seconds: 30);
  static const Duration receiveTimeout = Duration(seconds: 30);
}
