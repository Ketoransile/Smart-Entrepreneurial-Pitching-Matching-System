/// Centralized URL management for all API endpoints and base URLs.
/// This class provides a single source of truth for all backend communication.
class Urls {
  Urls._();

  // ============================================================================
  // BASE URL
  // ============================================================================

  /// Main API base URL - Production
  static const String baseUrl = 'https://sepms-backend.vercel.app/api';
  // static const String baseUrl =
  //     'https://smart-entrepreneurial-pitching-matching-system.vercel.app/api';

  // Alternative base URLs (uncomment for different environments)
  // static const String baseUrlDev = 'http://localhost:3000/api';
  // static const String baseUrlStaging = 'https://staging-api.example.com/api';

  // ============================================================================
  // AUTH ENDPOINTS
  // ============================================================================

  /// POST - User registration
  /// Body: {email, password, fullName, role}
  static const String authRegister = '/auth/register';

  /// POST - User login with email and password
  /// Body: {email, password}
  static const String authLogin = '/auth/login';

  /// GET - Get current user profile
  /// Headers: Authorization: Bearer {token}
  static const String authMe = '/auth/me';

  /// POST - Sign out user
  /// Headers: Authorization: Bearer {token}
  static const String authLogout = '/auth/logout';

  /// POST - Refresh authentication token
  /// Body: {refreshToken}
  static const String authRefreshToken = '/auth/refresh-token';

  /// POST - Send email verification code
  /// Body: {email}
  static const String authSendVerification = '/auth/send-verification';

  /// POST - Verify email with code
  /// Body: {email, code}
  static const String authVerifyEmail = '/auth/verify-email';

  /// POST - Request password reset
  /// Body: {email}
  static const String authForgotPassword = '/auth/forgot-password';

  /// POST - Reset password with token
  /// Body: {token, newPassword}
  static const String authResetPassword = '/auth/reset-password';

  // ============================================================================
  // USER PROFILE ENDPOINTS
  // ============================================================================

  /// GET - Get user profile by ID
  /// Path: /users/{userId}
  static const String getUserProfile = '/users';

  /// PUT - Update user profile
  /// Headers: Authorization: Bearer {token}
  /// Body: {displayName, photoURL, ...}
  static const String updateUserProfile = '/users/me';

  /// PUT - Update user role/status
  /// Headers: Authorization: Bearer {token}
  static const String updateUserRole = '/users/me/role';

  /// GET - Get user preferences
  /// Headers: Authorization: Bearer {token}
  static const String getUserPreferences = '/users/me/preferences';

  /// PUT - Update user preferences
  /// Headers: Authorization: Bearer {token}
  static const String updateUserPreferences = '/users/me/preferences';

  // ============================================================================
  // PITCH/BUSINESS PLAN ENDPOINTS
  // ============================================================================

  /// GET - List all pitches
  /// Query: ?page=1&limit=10&status=active
  static const String listPitches = '/pitches';

  /// POST - Create new pitch
  /// Headers: Authorization: Bearer {token}
  /// Body: FormData with pitch details and file
  static const String createPitch = '/pitches';

  /// GET - Get pitch by ID
  /// Path: /pitches/{pitchId}
  static const String getPitch = '/pitches';

  /// PUT - Update pitch
  /// Headers: Authorization: Bearer {token}
  /// Path: /pitches/{pitchId}
  static const String updatePitch = '/pitches';

  /// DELETE - Delete pitch
  /// Headers: Authorization: Bearer {token}
  /// Path: /pitches/{pitchId}
  static const String deletePitch = '/pitches';

  /// POST - Upload pitch document/file
  /// Headers: Authorization: Bearer {token}
  /// Body: FormData with file
  static const String uploadPitchFile = '/pitches/upload';

  /// POST - Submit pitch for review
  /// Headers: Authorization: Bearer {token}
  /// Path: /pitches/{pitchId}/submit
  static const String submitPitch = '/pitches/submit';

  // ============================================================================
  // INVESTOR PROFILE ENDPOINTS
  // ============================================================================

  /// GET - List all investors
  /// Query: ?page=1&limit=10&industries=tech,finance
  static const String listInvestors = '/investors';

  /// GET - Get investor profile by ID
  /// Path: /investors/{investorId}
  static const String getInvestor = '/investors';

  /// PUT - Update investor profile
  /// Headers: Authorization: Bearer {token}
  static const String updateInvestorProfile = '/investors/me';

  /// GET - Get investor portfolio
  /// Headers: Authorization: Bearer {token}
  static const String getInvestorPortfolio = '/investors/me/portfolio';

  /// POST - Add investment to portfolio
  /// Headers: Authorization: Bearer {token}
  static const String addInvestment = '/investors/me/portfolio';

  // ============================================================================
  // MATCHING & RECOMMENDATION ENDPOINTS
  // ============================================================================

  /// GET - Get recommended pitches for investor
  /// Headers: Authorization: Bearer {token}
  /// Query: ?page=1&limit=10
  static const String getRecommendedPitches = '/recommendations/pitches';

  /// GET - Get recommended investors for entrepreneur
  /// Headers: Authorization: Bearer {token}
  /// Query: ?page=1&limit=10
  static const String getRecommendedInvestors = '/recommendations/investors';

  /// POST - Create match between investor and entrepreneur
  /// Headers: Authorization: Bearer {token}
  static const String createMatch = '/matches';

  /// GET - List all matches
  /// Headers: Authorization: Bearer {token}
  static const String listMatches = '/matches';

  /// GET - Get match details
  /// Path: /matches/{matchId}
  static const String getMatch = '/matches';

  /// PUT - Update match status
  /// Headers: Authorization: Bearer {token}
  /// Path: /matches/{matchId}
  static const String updateMatchStatus = '/matches/status';

  // ============================================================================
  // MESSAGING ENDPOINTS
  // ============================================================================

  /// GET - List conversations
  /// Headers: Authorization: Bearer {token}
  static const String listConversations = '/messages/conversations';

  /// POST - Create conversation
  /// Headers: Authorization: Bearer {token}
  /// Body: {participantId}
  static const String createConversation = '/messages/conversations';

  /// GET - Get conversation messages
  /// Headers: Authorization: Bearer {token}
  /// Path: /messages/conversations/{conversationId}
  static const String getConversationMessages = '/messages/conversations';

  /// POST - Send message
  /// Headers: Authorization: Bearer {token}
  /// Body: {conversationId, text, attachments}
  static const String sendMessage = '/messages';

  // ============================================================================
  // MEETINGS ENDPOINTS
  // ============================================================================

  /// GET - List meetings
  /// Headers: Authorization: Bearer {token}
  /// Query: ?status=pending&limit=10
  static const String listMeetings = '/meetings';

  /// POST - Schedule meeting
  /// Headers: Authorization: Bearer {token}
  /// Body: {participantId, time, details, etc}
  static const String scheduleMeeting = '/meetings';

  /// PATCH - Update meeting status
  /// Headers: Authorization: Bearer {token}
  /// Path: /meetings/{meetingId}
  static const String updateMeetingStatus = '/meetings';

  // ============================================================================
  // SEARCH ENDPOINTS
  // ============================================================================

  /// GET - Search pitches
  /// Query: ?q=search_term&filters=...
  static const String searchPitches = '/search/pitches';

  /// GET - Search investors
  /// Query: ?q=search_term&filters=...
  static const String searchInvestors = '/search/investors';

  /// GET - Search entrepreneurs
  /// Query: ?q=search_term&filters=...
  static const String searchEntrepreneurs = '/search/entrepreneurs';

  // ============================================================================
  // NOTIFICATION ENDPOINTS
  // ============================================================================

  /// GET - List notifications
  /// Headers: Authorization: Bearer {token}
  static const String listNotifications = '/notifications';

  /// PUT - Mark notification as read
  /// Headers: Authorization: Bearer {token}
  /// Path: /notifications/{notificationId}/read
  static const String markNotificationRead = '/notifications/read';

  /// DELETE - Delete notification
  /// Headers: Authorization: Bearer {token}
  /// Path: /notifications/{notificationId}
  static const String deleteNotification = '/notifications';

  // ============================================================================
  // PAYMENT ENDPOINTS
  // ============================================================================

  /// POST - Initiate payment
  /// Headers: Authorization: Bearer {token}
  /// Body: {amount, currency, description}
  static const String initiatePayment = '/payments/initiate';

  /// POST - Verify payment
  /// Headers: Authorization: Bearer {token}
  /// Body: {transactionId, reference}
  static const String verifyPayment = '/payments/verify';

  /// GET - Get payment history
  /// Headers: Authorization: Bearer {token}
  static const String getPaymentHistory = '/payments/history';

  // ============================================================================
  // ANALYTICS ENDPOINTS
  // ============================================================================

  /// GET - Get analytics data
  /// Headers: Authorization: Bearer {token}
  static const String getAnalytics = '/analytics';

  /// POST - Log event
  /// Headers: Authorization: Bearer {token}
  /// Body: {event, data}
  static const String logEvent = '/analytics/events';

  // ============================================================================
  // ADMIN ENDPOINTS
  // ============================================================================

  /// GET - Get admin dashboard
  /// Headers: Authorization: Bearer {token}
  static const String adminDashboard = '/admin/dashboard';

  /// GET - List users (admin only)
  /// Headers: Authorization: Bearer {token}
  static const String adminListUsers = '/admin/users';

  /// PUT - Update user status (admin only)
  /// Headers: Authorization: Bearer {token}
  static const String adminUpdateUserStatus = '/admin/users/status';

  /// GET - Get reports (admin only)
  /// Headers: Authorization: Bearer {token}
  static const String adminReports = '/admin/reports';

  // ============================================================================
  // FEEDBACK ENDPOINTS
  // ============================================================================

  /// POST - Submit feedback
  /// Headers: Authorization: Bearer {token}
  static const String submitFeedback = '/feedback';

  /// GET - Get received feedback
  /// Headers: Authorization: Bearer {token}
  static const String getFeedbackReceived = '/feedback/me/received';

  /// GET - Get given feedback
  /// Headers: Authorization: Bearer {token}
  static const String getFeedbackGiven = '/feedback/me/given';

  /// GET - Get feedback summary
  /// Headers: Authorization: Bearer {token}
  static const String getFeedbackSummary = '/feedback/me/summary';

  // ============================================================================
  // MILESTONES ENDPOINTS
  // ============================================================================

  /// GET - List milestones
  /// Headers: Authorization: Bearer {token}
  static const String listMilestones = '/milestones';

  /// POST - Create milestone
  /// Headers: Authorization: Bearer {token}
  static const String createMilestone = '/milestones';

  /// PATCH - Update milestone
  /// Headers: Authorization: Bearer {token}
  /// Path: /milestones/{milestoneId}
  static const String updateMilestone = '/milestones';

  /// POST - Add milestone evidence
  /// Headers: Authorization: Bearer {token}
  /// Path: /milestones/{milestoneId}/evidence
  static const String addMilestoneEvidence = '/milestones';

  /// POST - Verify milestone
  /// Headers: Authorization: Bearer {token}
  /// Path: /milestones/{milestoneId}/verify
  static const String verifyMilestone = '/milestones';

  // ============================================================================
  // DOCUMENTS ENDPOINTS
  // ============================================================================

  /// GET - List documents
  /// Headers: Authorization: Bearer {token}
  static const String listDocuments = '/documents';

  /// POST - Upload document
  /// Headers: Authorization: Bearer {token}
  /// Body: FormData with file
  static const String uploadDocument = '/documents';

  /// DELETE - Delete document
  /// Headers: Authorization: Bearer {token}
  /// Path: /documents/{documentId}
  static const String deleteDocument = '/documents';

  /// GET - Get document validation
  /// Headers: Authorization: Bearer {token}
  /// Path: /documents/{documentId}/validation
  static const String getDocumentValidation = '/documents';

  // ============================================================================
  // UPLOAD ENDPOINTS
  // ============================================================================

  /// POST - Upload file/image
  /// Headers: Authorization: Bearer {token}
  /// Body: FormData with file
  static const String uploadFile = '/upload';

  /// DELETE - Delete uploaded file
  /// Headers: Authorization: Bearer {token}
  /// Path: /upload/{publicId}
  static const String deleteUploadedFile = '/upload';

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /// Build full URL from endpoint and optional path parameter
  /// Example: Urls.buildUrl(Urls.getPitch, pitchId)
  /// Result: /pitches/123
  static String buildUrl(String endpoint, [String? pathParam]) {
    if (pathParam == null) return endpoint;
    return '$endpoint/$pathParam';
  }

  /// Build full URL with multiple path parameters
  /// Example: Urls.buildUrlMultiple('/users', [userId, 'profile'])
  /// Result: /users/123/profile
  static String buildUrlMultiple(String endpoint, List<String> pathParams) {
    if (pathParams.isEmpty) return endpoint;
    return '$endpoint/${pathParams.join('/')}';
  }

  /// Build query string from parameters
  /// Example: Urls.buildQuery({'page': '1', 'limit': '10'})
  /// Result: ?page=1&limit=10
  static String buildQuery(Map<String, String> params) {
    if (params.isEmpty) return '';
    final entries = params.entries.map((e) => '${e.key}=${e.value}');
    return '?${entries.join('&')}';
  }
}
