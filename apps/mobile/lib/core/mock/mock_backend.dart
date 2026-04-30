import 'dart:math';

import '../../features/auth/data/models/user_model.dart';
import '../../features/auth/domain/entities/user_entity.dart';
import '../../features/matching/data/models/match_result_model.dart';
import '../../features/meetings/data/models/meeting_model.dart';
import '../../features/meetings/domain/entities/meeting_entity.dart';
import '../../features/messaging/data/models/conversation_model.dart';
import '../../features/messaging/data/models/message_model.dart';
import '../../features/messaging/data/models/notification_model.dart';
import '../../features/submissions/data/models/submission_model.dart';
import '../../features/submissions/domain/entities/submission_entity.dart';

/// Lightweight, in-memory mock backend used for UI preview when the real
/// backend is unavailable.
///
/// Notes:
/// - Uses JSON-like maps and converts through existing `fromJson` factories to
///   stay aligned with app parsing expectations.
/// - Keeps a mutable store so create/update actions reflect in subsequent reads.
class MockBackend {
  MockBackend._();

  static final _rng = Random(42);

  static bool _seeded = false;

  static void ensureSeeded({String? currentUserId}) {
    if (_seeded) return;
    _seeded = true;

    final now = DateTime.now().toUtc();
    final entrepreneurId = currentUserId ?? 'user_entrepreneur_001';
    const investorId = 'user_investor_001';

    // Submissions (entrepreneur drafts + submitted)
    _submissions = [
      _submissionJson(
        id: 'pitch_001',
        entrepreneurId: entrepreneurId,
        title: 'AgriSense: Smart Irrigation for Small Farms',
        summary:
            'IoT + analytics to reduce water usage and increase yield for smallholder farmers.',
        sector: 'Agriculture',
        stage: SubmissionStage.mvp,
        status: SubmissionStatus.draft,
        currentStep: 2,
        aiScore: 0.62,
        createdAt: now.subtract(const Duration(days: 6)),
        updatedAt: now.subtract(const Duration(hours: 8)),
      ),
      _submissionJson(
        id: 'pitch_002',
        entrepreneurId: entrepreneurId,
        title: 'ClinicFlow: Queue & Records for Rural Clinics',
        summary:
            'A lightweight clinic operations app for patient queueing, visits, and reporting.',
        sector: 'Health',
        stage: SubmissionStage.earlyRevenue,
        status: SubmissionStatus.submitted,
        currentStep: 4,
        aiScore: 0.78,
        createdAt: now.subtract(const Duration(days: 18)),
        updatedAt: now.subtract(const Duration(days: 2)),
        submittedAt: now.subtract(const Duration(days: 2)),
      ),
      _submissionJson(
        id: 'pitch_003',
        entrepreneurId: 'user_entrepreneur_002',
        title: 'PayLite: SMB Billing & Inventory',
        summary:
            'Mobile-first invoicing and inventory for micro-retailers with offline support.',
        sector: 'Fintech',
        stage: SubmissionStage.scaling,
        status: SubmissionStatus.approved,
        currentStep: 5,
        aiScore: 0.86,
        createdAt: now.subtract(const Duration(days: 45)),
        updatedAt: now.subtract(const Duration(days: 3)),
        submittedAt: now.subtract(const Duration(days: 40)),
      ),
    ];

    // Matches/queue
    _matchResults = [
      _matchJson(
        id: 'match_001',
        submissionId: 'pitch_002',
        entrepreneurId: entrepreneurId,
        investorId: investorId,
        score: 0.84,
        rank: 1,
        status: 'requested',
        matchedAt: now.subtract(const Duration(days: 1)),
      ),
      _matchJson(
        id: 'match_002',
        submissionId: 'pitch_001',
        entrepreneurId: entrepreneurId,
        investorId: investorId,
        score: 0.71,
        rank: 2,
        status: 'pending',
        matchedAt: now.subtract(const Duration(days: 3)),
      ),
    ];

    // Meetings
    _meetings = [
      _meetingJson(
        id: 'meeting_001',
        organizerId: investorId,
        participants: [entrepreneurId, investorId],
        submissionId: 'pitch_002',
        title: 'Intro call: ClinicFlow',
        scheduledAt: now.add(const Duration(days: 1, hours: 2)),
        durationMinutes: 30,
        status: MeetingStatus.scheduled,
        meetingUrl: 'https://meet.example.com/clinicflow-intro',
        notes: 'Discuss traction, GTM, and integration approach.',
      ),
      _meetingJson(
        id: 'meeting_002',
        organizerId: entrepreneurId,
        participants: [entrepreneurId, investorId],
        submissionId: 'pitch_001',
        title: 'Product demo: AgriSense',
        scheduledAt: now.subtract(const Duration(hours: 5)),
        durationMinutes: 45,
        status: MeetingStatus.completed,
        meetingUrl: 'https://meet.example.com/agrisense-demo',
        notes: 'Share pilot results and roadmap.',
      ),
    ];

    // Messaging
    _conversations = [
      ConversationModel.fromJson({
        '_id': 'conv_001',
        'participants': [
          {'_id': entrepreneurId, 'fullName': 'You'},
          {'_id': investorId, 'fullName': 'Alemu Bekele'},
        ],
        'otherUserName': 'Alemu Bekele',
        'unreadCount': 2,
        'title': 'ClinicFlow • Alemu',
        'updatedAt': now.toIso8601String(),
      }),
      ConversationModel.fromJson({
        '_id': 'conv_002',
        'participants': [
          {'_id': entrepreneurId, 'fullName': 'You'},
          {'_id': 'user_investor_002', 'fullName': 'Sara Mekonnen'},
        ],
        'otherUserName': 'Sara Mekonnen',
        'unreadCount': 0,
        'title': 'AgriSense • Sara',
        'updatedAt': now.subtract(const Duration(days: 2)).toIso8601String(),
      }),
    ];

    _messagesByConversation = {
      'conv_001': [
        _messageModel(
          id: 'msg_001',
          conversationId: 'conv_001',
          senderId: investorId,
          body: 'Hi! I reviewed ClinicFlow — can you share your current MAUs?',
          createdAt: now.subtract(const Duration(hours: 4)),
        ),
        _messageModel(
          id: 'msg_002',
          conversationId: 'conv_001',
          senderId: entrepreneurId,
          body:
              'Sure. We have ~1,200 MAUs across 6 clinics, with 3 paid pilots.',
          createdAt: now.subtract(const Duration(hours: 3, minutes: 35)),
        ),
        _messageModel(
          id: 'msg_003',
          conversationId: 'conv_001',
          senderId: investorId,
          body: 'Great — are you available tomorrow for a 30-min call?',
          createdAt: now.subtract(const Duration(hours: 3)),
        ),
      ],
      'conv_002': [
        _messageModel(
          id: 'msg_101',
          conversationId: 'conv_002',
          senderId: 'user_investor_002',
          body: 'Your AgriSense deck looks strong. Do you have pilot data?',
          createdAt: now.subtract(const Duration(days: 2, hours: 3)),
        ),
        _messageModel(
          id: 'msg_102',
          conversationId: 'conv_002',
          senderId: entrepreneurId,
          body:
              'Yes — 18 farms, ~22% reduction in water usage over 6 weeks.',
          createdAt: now.subtract(const Duration(days: 2, hours: 2, minutes: 40)),
        ),
      ],
    };

    _notifications = [
      NotificationModel.fromJson({
        '_id': 'notif_001',
        'type': 'match',
        'title': 'New investor match',
        'body': 'Alemu Bekele requested a conversation about ClinicFlow.',
        'isRead': false,
        'createdAt': now.subtract(const Duration(hours: 1)).toIso8601String(),
      }),
      NotificationModel.fromJson({
        '_id': 'notif_002',
        'type': 'meeting',
        'title': 'Meeting scheduled',
        'body': 'Intro call: ClinicFlow is scheduled for tomorrow.',
        'isRead': true,
        'createdAt': now.subtract(const Duration(days: 1)).toIso8601String(),
      }),
    ];
  }

  // ---------------------------------------------------------------------------
  // Auth / user
  // ---------------------------------------------------------------------------

  static UserModel mockUser({
    required String uid,
    String? email,
    String? displayName,
    UserRole role = UserRole.entrepreneur,
  }) {
    final now = DateTime.now().toUtc();
    return UserModel.fromJson({
      'uid': uid,
      'email': email ?? 'demo@sepms.app',
      'displayName': displayName ?? 'Demo User',
      'role': role.name,
      'status': 'verified',
      'photoURL':
          'https://i.pravatar.cc/300?img=${1 + _rng.nextInt(50)}',
      'emailVerified': true,
      'isActive': true,
      'lastLoginAt': now.toIso8601String(),
      'createdAt': now.subtract(const Duration(days: 120)).toIso8601String(),
      'updatedAt': now.toIso8601String(),
    });
  }

  // ---------------------------------------------------------------------------
  // Submissions
  // ---------------------------------------------------------------------------

  static List<Map<String, dynamic>> _submissions = [];

  static List<SubmissionModel> listMySubmissions(String entrepreneurId) {
    ensureSeeded(currentUserId: entrepreneurId);
    return _submissions
        .where((s) => (s['entrepreneurId'] as String?) == entrepreneurId)
        .map((e) => SubmissionModel.fromJson(e))
        .toList();
  }

  static SubmissionModel getSubmissionById(String id) {
    ensureSeeded();
    final found = _submissions.firstWhere(
      (s) => (s['_id'] as String?) == id || (s['id'] as String?) == id,
      orElse: () => _submissionJson(
        id: id,
        entrepreneurId: 'user_entrepreneur_001',
        title: 'Untitled Pitch',
        summary: '',
        sector: 'General',
        stage: SubmissionStage.mvp,
        status: SubmissionStatus.draft,
        currentStep: 1,
        aiScore: null,
        createdAt: DateTime.now().toUtc(),
        updatedAt: DateTime.now().toUtc(),
      ),
    );
    return SubmissionModel.fromJson(found);
  }

  static SubmissionModel createDraft({
    required String entrepreneurId,
    String? title,
    String? sector,
    String? stage,
  }) {
    ensureSeeded(currentUserId: entrepreneurId);
    final now = DateTime.now().toUtc();
    final id = 'pitch_${100 + _submissions.length}';
    final s = _submissionJson(
      id: id,
      entrepreneurId: entrepreneurId,
      title: (title?.isNotEmpty ?? false) ? title! : 'New Pitch Draft',
      summary: 'Add a short summary to improve your pitch quality.',
      sector: (sector?.isNotEmpty ?? false) ? sector! : 'Technology',
      stage: _parseStageLoose(stage),
      status: SubmissionStatus.draft,
      currentStep: 1,
      aiScore: null,
      createdAt: now,
      updatedAt: now,
    );
    _submissions.insert(0, s);
    return SubmissionModel.fromJson(s);
  }

  static SubmissionModel updateDraft(String id, Map<String, dynamic> patch) {
    ensureSeeded();
    final idx = _submissions.indexWhere(
      (s) => (s['_id'] as String?) == id || (s['id'] as String?) == id,
    );
    final now = DateTime.now().toUtc();
    if (idx == -1) {
      final created = _submissionJson(
        id: id,
        entrepreneurId: (patch['entrepreneurId'] as String?) ??
            'user_entrepreneur_001',
        title: (patch['title'] as String?) ?? 'Updated Pitch',
        summary: (patch['summary'] as String?) ?? '',
        sector: (patch['sector'] as String?) ?? 'General',
        stage: _parseStageLoose(patch['stage'] as String?),
        status: SubmissionStatus.draft,
        currentStep: 1,
        aiScore: null,
        createdAt: now,
        updatedAt: now,
      );
      _submissions.insert(0, created);
      return SubmissionModel.fromJson(created);
    }

    final existing = Map<String, dynamic>.from(_submissions[idx]);
    existing.addAll(patch);
    existing['updatedAt'] = now.toIso8601String();
    _submissions[idx] = existing;
    return SubmissionModel.fromJson(existing);
  }

  static void deleteDraft(String id) {
    ensureSeeded();
    _submissions.removeWhere(
        (s) => (s['_id'] as String?) == id || (s['id'] as String?) == id);
  }

  static void submitPitch(String id) {
    ensureSeeded();
    final idx = _submissions.indexWhere(
      (s) => (s['_id'] as String?) == id || (s['id'] as String?) == id,
    );
    if (idx == -1) return;
    final now = DateTime.now().toUtc();
    final existing = Map<String, dynamic>.from(_submissions[idx]);
    existing['status'] = 'submitted';
    existing['submittedAt'] = now.toIso8601String();
    existing['updatedAt'] = now.toIso8601String();
    _submissions[idx] = existing;
  }

  static Map<String, dynamic> completeness(String id) {
    final s = getSubmissionById(id);
    final json = s.toJson();
    final filledFields = <String, bool>{
      'title': s.title.isNotEmpty,
      'summary': s.summary.isNotEmpty,
      'problem.statement': s.problem.statement.isNotEmpty,
      'solution.description': s.solution.description.isNotEmpty,
      'businessModel.revenueStreams': s.businessModel.revenueStreams.isNotEmpty,
      'financials.currentRevenue': s.financials.currentRevenue.isNotEmpty,
      'documents': s.documents.isNotEmpty,
    };
    final percent =
        (filledFields.values.where((v) => v).length / filledFields.length) * 100;
    return {
      'submission': json,
      'completeness': percent.round(),
      'fields': filledFields,
    };
  }

  // ---------------------------------------------------------------------------
  // Feed / saved
  // ---------------------------------------------------------------------------

  static List<SubmissionModel> browseFeed({String? sector, int? limit}) {
    ensureSeeded();
    final all = _submissions.map((e) => SubmissionModel.fromJson(e)).toList();
    final filtered = (sector == null || sector.isEmpty)
        ? all
        : all.where((s) => s.sector.toLowerCase() == sector.toLowerCase()).toList();
    return filtered.take(limit ?? 20).toList();
  }

  static final Set<String> _savedPitchIds = {'pitch_003'};

  static List<SubmissionModel> listSavedPitches() {
    ensureSeeded();
    return _submissions
        .where((s) => _savedPitchIds.contains((s['_id'] as String?) ?? ''))
        .map((e) => SubmissionModel.fromJson(e))
        .toList();
  }

  static void toggleSaved(String pitchId) {
    if (_savedPitchIds.contains(pitchId)) {
      _savedPitchIds.remove(pitchId);
    } else {
      _savedPitchIds.add(pitchId);
    }
  }

  // ---------------------------------------------------------------------------
  // Matching / queue
  // ---------------------------------------------------------------------------

  static List<Map<String, dynamic>> _matchResults = [];

  static void runMatching(String submissionId) {
    ensureSeeded();
    final now = DateTime.now().toUtc();
    if (_matchResults.any((m) => m['submissionId'] == submissionId)) return;
    _matchResults.add(_matchJson(
      id: 'match_${100 + _matchResults.length}',
      submissionId: submissionId,
      entrepreneurId: 'user_entrepreneur_001',
      investorId: 'user_investor_003',
      score: 0.66 + _rng.nextDouble() * 0.25,
      rank: _matchResults.length + 1,
      status: 'pending',
      matchedAt: now,
    ));
  }

  static List<MatchResultModel> matchResults(String submissionId) {
    ensureSeeded();
    return _matchResults
        .where((m) => (m['submissionId'] as String?) == submissionId)
        .map((e) => MatchResultModel.fromJson(e))
        .toList();
  }

  static List<MatchResultModel> matchQueue({String? status}) {
    ensureSeeded();
    final list = _matchResults.map((e) => MatchResultModel.fromJson(e)).toList();
    if (status == null || status.isEmpty) return list;
    return list.where((m) => m.status.name == status).toList();
  }

  static void updateMatchStatus(String matchId, String status) {
    ensureSeeded();
    final idx = _matchResults.indexWhere((m) => m['_id'] == matchId || m['id'] == matchId);
    if (idx == -1) return;
    final now = DateTime.now().toUtc();
    final existing = Map<String, dynamic>.from(_matchResults[idx]);
    existing['status'] = status;
    existing['updatedAt'] = now.toIso8601String();
    _matchResults[idx] = existing;
  }

  // ---------------------------------------------------------------------------
  // Meetings
  // ---------------------------------------------------------------------------

  static List<Map<String, dynamic>> _meetings = [];

  static List<MeetingModel> listMeetings({String? status}) {
    ensureSeeded();
    var list = _meetings.map((e) => MeetingModel.fromJson(e)).toList();
    if (status != null && status.isNotEmpty) {
      list = list.where((m) => m.status.name == status).toList();
    }
    return list;
  }

  static MeetingModel scheduleMeeting(Map<String, dynamic> payload) {
    ensureSeeded();
    final now = DateTime.now().toUtc();
    final id = 'meeting_${100 + _meetings.length}';
    final scheduledAt = DateTime.tryParse(payload['scheduledAt']?.toString() ?? '') ??
        now.add(const Duration(days: 1));
    final m = _meetingJson(
      id: id,
      organizerId: (payload['organizerId'] as String?) ?? 'user_investor_001',
      participants: (payload['participants'] as List?)
              ?.whereType<String>()
              .toList() ??
          ['user_entrepreneur_001', 'user_investor_001'],
      submissionId: payload['submissionId'] as String?,
      title: (payload['title'] as String?) ?? 'Scheduled meeting',
      scheduledAt: scheduledAt,
      durationMinutes: ((payload['durationMinutes'] as num?) ?? 30).toInt(),
      status: MeetingStatus.scheduled,
      meetingUrl: 'https://meet.example.com/$id',
      notes: payload['notes'] as String?,
    );
    _meetings.insert(0, m);
    return MeetingModel.fromJson(m);
  }

  static MeetingModel updateMeetingStatus(String meetingId, Map<String, dynamic> payload) {
    ensureSeeded();
    final idx = _meetings.indexWhere((m) => m['_id'] == meetingId || m['id'] == meetingId);
    if (idx == -1) {
      return MeetingModel.fromJson(_meetingJson(
        id: meetingId,
        organizerId: 'user_investor_001',
        participants: const ['user_entrepreneur_001', 'user_investor_001'],
        submissionId: null,
        title: 'Meeting',
        scheduledAt: DateTime.now().toUtc(),
        durationMinutes: 30,
        status: MeetingStatus.scheduled,
        meetingUrl: null,
        notes: null,
      ));
    }
    final now = DateTime.now().toUtc();
    final existing = Map<String, dynamic>.from(_meetings[idx]);
    existing.addAll(payload);
    existing['updatedAt'] = now.toIso8601String();
    _meetings[idx] = existing;
    return MeetingModel.fromJson(existing);
  }

  // ---------------------------------------------------------------------------
  // Messaging
  // ---------------------------------------------------------------------------

  static List<ConversationModel> _conversations = [];
  static Map<String, List<MessageModel>> _messagesByConversation = {};
  static List<NotificationModel> _notifications = [];

  static List<ConversationModel> listConversations() {
    ensureSeeded();
    return List.unmodifiable(_conversations);
  }

  static ConversationModel createOrGetConversation({
    required String otherUserId,
    String? matchResultId,
    String? submissionId,
  }) {
    ensureSeeded();
    final existing = _conversations.where((c) {
      final parts = c.participants;
      return parts.contains(otherUserId);
    }).toList();
    if (existing.isNotEmpty) return existing.first;

    final now = DateTime.now().toUtc();
    final id = 'conv_${100 + _conversations.length}';
    final conv = ConversationModel.fromJson({
      '_id': id,
      'participants': [
        {'_id': 'user_entrepreneur_001', 'fullName': 'You'},
        {'_id': otherUserId, 'fullName': 'New Contact'},
      ],
      'otherUserName': 'New Contact',
      'matchResultId': matchResultId,
      'submissionId': submissionId,
      'unreadCount': 0,
      'title': 'Conversation',
      'updatedAt': now.toIso8601String(),
    });
    _conversations.insert(0, conv);
    _messagesByConversation[id] = [
      _messageModel(
        id: 'msg_${200 + _rng.nextInt(1000)}',
        conversationId: id,
        senderId: otherUserId,
        body: 'Hello! Looking forward to learning more.',
        createdAt: now,
      ),
    ];
    return conv;
  }

  static List<MessageModel> listMessages(String conversationId, {int? limit}) {
    ensureSeeded();
    final list = _messagesByConversation[conversationId] ?? const [];
    if (limit == null) return List.unmodifiable(list);
    return list.take(limit).toList();
  }

  static MessageModel sendMessage(
    String conversationId, {
    required String body,
    String type = 'text',
    String? attachmentUrl,
    String senderId = 'user_entrepreneur_001',
  }) {
    ensureSeeded();
    final now = DateTime.now().toUtc();
    final msg = MessageModel.fromJson({
      '_id': 'msg_${1000 + _rng.nextInt(9000)}',
      'conversationId': conversationId,
      'senderId': senderId,
      'body': body,
      'type': type,
      if (attachmentUrl != null && attachmentUrl.isNotEmpty)
        'attachmentUrl': attachmentUrl,
      'readBy': const [],
      'isDeleted': false,
      'createdAt': now.toIso8601String(),
      'updatedAt': now.toIso8601String(),
    });
    final list = _messagesByConversation.putIfAbsent(conversationId, () => []);
    list.add(msg);

    // bump conversation updatedAt/unreadCount
    final cIdx = _conversations.indexWhere((c) => c.id == conversationId);
    if (cIdx != -1) {
      final data = Map<String, dynamic>.from(_conversations[cIdx].data);
      data['updatedAt'] = now.toIso8601String();
      _conversations[cIdx] = ConversationModel.fromJson(data);
    }
    return msg;
  }

  static void markConversationRead(String conversationId) {
    ensureSeeded();
    final idx = _conversations.indexWhere((c) => c.id == conversationId);
    if (idx == -1) return;
    final data = Map<String, dynamic>.from(_conversations[idx].data);
    data['unreadCount'] = 0;
    _conversations[idx] = ConversationModel.fromJson(data);
  }

  static int unreadCount() {
    ensureSeeded();
    return _conversations.fold<int>(0, (sum, c) => sum + c.unreadCount);
  }

  static List<NotificationModel> listNotifications() {
    ensureSeeded();
    return List.unmodifiable(_notifications);
  }

  static void markNotificationRead(String notificationId) {
    ensureSeeded();
    final idx = _notifications.indexWhere(
        (n) => n.data['_id'] == notificationId || n.data['id'] == notificationId);
    if (idx == -1) return;
    final data = Map<String, dynamic>.from(_notifications[idx].data);
    data['isRead'] = true;
    _notifications[idx] = NotificationModel.fromJson(data);
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  static MessageModel _messageModel({
    required String id,
    required String conversationId,
    required String senderId,
    required String body,
    required DateTime createdAt,
  }) {
    return MessageModel.fromJson({
      '_id': id,
      'conversationId': conversationId,
      'senderId': senderId,
      'body': body,
      'type': 'text',
      'readBy': const [],
      'isDeleted': false,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': createdAt.toIso8601String(),
    });
  }

  static SubmissionStage _parseStageLoose(String? stage) {
    switch (stage) {
      case 'mvp':
        return SubmissionStage.mvp;
      case 'early-revenue':
      case 'earlyRevenue':
        return SubmissionStage.earlyRevenue;
      case 'scaling':
        return SubmissionStage.scaling;
      default:
        return SubmissionStage.mvp;
    }
  }

  static Map<String, dynamic> _submissionJson({
    required String id,
    required String entrepreneurId,
    required String title,
    required String summary,
    required String sector,
    required SubmissionStage stage,
    required SubmissionStatus status,
    required int currentStep,
    required double? aiScore,
    required DateTime createdAt,
    required DateTime updatedAt,
    DateTime? submittedAt,
  }) {
    return {
      '_id': id,
      'entrepreneurId': entrepreneurId,
      'title': title,
      'summary': summary,
      'sector': sector,
      'stage': stage == SubmissionStage.earlyRevenue ? 'early-revenue' : stage.name,
      'targetAmount': 25000 + _rng.nextInt(200000),
      'currency': 'USD',
      'problem': {
        'statement': 'A major pain point in $sector that costs time and money.',
        'targetMarket': 'SMEs and early adopters in emerging markets',
        'marketSize': 'Large and growing',
      },
      'solution': {
        'description': 'A simple, mobile-first product with strong UX.',
        'uniqueValue': 'Works offline and integrates with existing workflows.',
        'competitiveAdvantage': 'Local distribution + data-driven insights.',
      },
      'businessModel': {
        'revenueStreams': 'Subscription + transaction fees',
        'pricingStrategy': 'Tiered plans for SMBs',
        'customerAcquisition': 'Partnerships and community ambassadors',
      },
      'financials': {
        'currentRevenue': status == SubmissionStatus.draft ? '' : '\$3,500/mo',
        'projectedRevenue': '\$25,000/mo',
        'burnRate': '\$4,000/mo',
        'runway': '10 months',
      },
      'documents': [
        {
          'name': 'Pitch Deck.pdf',
          'url': 'https://example.com/pitch-deck.pdf',
          'type': 'pitch_deck',
          'size': 245678,
          'uploadedAt': updatedAt.toIso8601String(),
        },
      ],
      if (aiScore != null) 'aiScore': aiScore,
      'aiAnalysis': {
        'highlights': ['Clear problem', 'Compelling market', 'Strong team'],
        'risks': ['Execution', 'Distribution'],
      },
      'currentStep': currentStep,
      'status': _submissionStatusToString(status),
      if (submittedAt != null) 'submittedAt': submittedAt.toIso8601String(),
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  static String _submissionStatusToString(SubmissionStatus status) {
    switch (status) {
      case SubmissionStatus.draft:
        return 'draft';
      case SubmissionStatus.submitted:
        return 'submitted';
      case SubmissionStatus.underReview:
        return 'under_review';
      case SubmissionStatus.approved:
        return 'approved';
      case SubmissionStatus.rejected:
        return 'rejected';
      case SubmissionStatus.suspended:
        return 'suspended';
      case SubmissionStatus.matched:
        return 'matched';
      case SubmissionStatus.closed:
        return 'closed';
    }
  }

  static Map<String, dynamic> _matchJson({
    required String id,
    required String submissionId,
    required String entrepreneurId,
    required String investorId,
    required double score,
    required int? rank,
    required String status,
    required DateTime matchedAt,
  }) {
    final now = DateTime.now().toUtc();
    return {
      '_id': id,
      'submissionId': submissionId,
      'entrepreneurId': entrepreneurId,
      'investorId': investorId,
      'score': score,
      if (rank != null) 'rank': rank,
      'aiRationale':
          'Strong alignment on sector and stage; clear path to growth and measurable traction.',
      'scoreBreakdown': {
        'sector': min(1, 0.7 + _rng.nextDouble() * 0.3),
        'stage': min(1, 0.6 + _rng.nextDouble() * 0.4),
        'budget': min(1, 0.5 + _rng.nextDouble() * 0.5),
        'embedding': min(1, 0.65 + _rng.nextDouble() * 0.35),
      },
      'status': status,
      'matchedAt': matchedAt.toIso8601String(),
      'expiresAt': now.add(const Duration(days: 7)).toIso8601String(),
      'createdAt': matchedAt.toIso8601String(),
      'updatedAt': now.toIso8601String(),
    };
  }

  static Map<String, dynamic> _meetingJson({
    required String id,
    required String organizerId,
    required List<String> participants,
    required String? submissionId,
    required String title,
    required DateTime scheduledAt,
    required int durationMinutes,
    required MeetingStatus status,
    required String? meetingUrl,
    required String? notes,
  }) {
    final now = DateTime.now().toUtc();
    return {
      '_id': id,
      'organizerId': organizerId,
      'participants': participants,
      if (submissionId != null) 'submissionId': submissionId,
      'title': title,
      'scheduledAt': scheduledAt.toIso8601String(),
      'durationMinutes': durationMinutes,
      if (meetingUrl != null) 'meetingUrl': meetingUrl,
      'livekitRoomName': 'room_$id',
      'status': status.name,
      if (notes != null) 'notes': notes,
      'createdAt': now.subtract(const Duration(days: 3)).toIso8601String(),
      'updatedAt': now.toIso8601String(),
    };
  }
}

