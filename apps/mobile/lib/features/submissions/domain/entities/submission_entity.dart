import 'package:equatable/equatable.dart';

enum SubmissionStage { mvp, earlyRevenue, scaling }

enum SubmissionStatus {
  draft,
  submitted,
  underReview,
  approved,
  rejected,
  suspended,
  matched,
  closed
}

class SubmissionProblem extends Equatable {
  final String statement;
  final String targetMarket;
  final String marketSize;

  const SubmissionProblem({
    required this.statement,
    required this.targetMarket,
    required this.marketSize,
  });

  factory SubmissionProblem.fromJson(Map<String, dynamic>? json) {
    if (json == null) {
      return const SubmissionProblem(
        statement: '',
        targetMarket: '',
        marketSize: '',
      );
    }
    return SubmissionProblem(
      statement: (json['statement'] as String?) ?? '',
      targetMarket: (json['targetMarket'] as String?) ?? '',
      marketSize: (json['marketSize'] as String?) ?? '',
    );
  }

  Map<String, dynamic> toJson() => {
        'statement': statement,
        'targetMarket': targetMarket,
        'marketSize': marketSize,
      };

  @override
  List<Object?> get props => [statement, targetMarket, marketSize];
}

class SubmissionSolution extends Equatable {
  final String description;
  final String uniqueValue;
  final String competitiveAdvantage;

  const SubmissionSolution({
    required this.description,
    required this.uniqueValue,
    required this.competitiveAdvantage,
  });

  factory SubmissionSolution.fromJson(Map<String, dynamic>? json) {
    if (json == null) {
      return const SubmissionSolution(
        description: '',
        uniqueValue: '',
        competitiveAdvantage: '',
      );
    }
    return SubmissionSolution(
      description: (json['description'] as String?) ?? '',
      uniqueValue: (json['uniqueValue'] as String?) ?? '',
      competitiveAdvantage: (json['competitiveAdvantage'] as String?) ?? '',
    );
  }

  Map<String, dynamic> toJson() => {
        'description': description,
        'uniqueValue': uniqueValue,
        'competitiveAdvantage': competitiveAdvantage,
      };

  @override
  List<Object?> get props => [description, uniqueValue, competitiveAdvantage];
}

class SubmissionBusinessModel extends Equatable {
  final String revenueStreams;
  final String pricingStrategy;
  final String customerAcquisition;

  const SubmissionBusinessModel({
    required this.revenueStreams,
    required this.pricingStrategy,
    required this.customerAcquisition,
  });

  factory SubmissionBusinessModel.fromJson(Map<String, dynamic>? json) {
    if (json == null) {
      return const SubmissionBusinessModel(
        revenueStreams: '',
        pricingStrategy: '',
        customerAcquisition: '',
      );
    }
    return SubmissionBusinessModel(
      revenueStreams: (json['revenueStreams'] as String?) ?? '',
      pricingStrategy: (json['pricingStrategy'] as String?) ?? '',
      customerAcquisition: (json['customerAcquisition'] as String?) ?? '',
    );
  }

  Map<String, dynamic> toJson() => {
        'revenueStreams': revenueStreams,
        'pricingStrategy': pricingStrategy,
        'customerAcquisition': customerAcquisition,
      };

  @override
  List<Object?> get props =>
      [revenueStreams, pricingStrategy, customerAcquisition];
}

class SubmissionFinancials extends Equatable {
  final String currentRevenue;
  final String projectedRevenue;
  final String burnRate;
  final String runway;

  const SubmissionFinancials({
    required this.currentRevenue,
    required this.projectedRevenue,
    required this.burnRate,
    required this.runway,
  });

  factory SubmissionFinancials.fromJson(Map<String, dynamic>? json) {
    if (json == null) {
      return const SubmissionFinancials(
        currentRevenue: '',
        projectedRevenue: '',
        burnRate: '',
        runway: '',
      );
    }
    return SubmissionFinancials(
      currentRevenue: (json['currentRevenue'] as String?) ?? '',
      projectedRevenue: (json['projectedRevenue'] as String?) ?? '',
      burnRate: (json['burnRate'] as String?) ?? '',
      runway: (json['runway'] as String?) ?? '',
    );
  }

  Map<String, dynamic> toJson() => {
        'currentRevenue': currentRevenue,
        'projectedRevenue': projectedRevenue,
        'burnRate': burnRate,
        'runway': runway,
      };

  @override
  List<Object?> get props =>
      [currentRevenue, projectedRevenue, burnRate, runway];
}

class SubmissionDocument extends Equatable {
  final String name;
  final String url;
  final String type;
  final String? cloudinaryId;
  final int? size;
  final DateTime uploadedAt;

  const SubmissionDocument({
    required this.name,
    required this.url,
    required this.type,
    this.cloudinaryId,
    this.size,
    required this.uploadedAt,
  });

  factory SubmissionDocument.fromJson(Map<String, dynamic> json) {
    return SubmissionDocument(
      name: (json['name'] as String?) ?? '',
      url: (json['url'] as String?) ?? '',
      type: (json['type'] as String?) ?? 'other',
      cloudinaryId: json['cloudinaryId'] as String?,
      size: json['size'] as int?,
      uploadedAt: _parseDate(json['uploadedAt']) ?? DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() => {
        'name': name,
        'url': url,
        'type': type,
        if (cloudinaryId != null) 'cloudinaryId': cloudinaryId,
        if (size != null) 'size': size,
        'uploadedAt': uploadedAt.toIso8601String(),
      };

  @override
  List<Object?> get props => [name, url, type, cloudinaryId, size, uploadedAt];
}

class SubmissionEntity extends Equatable {
  final String id;
  final String entrepreneurId;
  final String title;
  final String summary;
  final String sector;
  final SubmissionStage stage;
  final double? targetAmount;
  final String currency;
  final SubmissionProblem problem;
  final SubmissionSolution solution;
  final SubmissionBusinessModel businessModel;
  final SubmissionFinancials financials;
  final List<SubmissionDocument> documents;
  final double? aiScore;
  final Map<String, dynamic>? aiAnalysis;
  final int currentStep;
  final SubmissionStatus status;
  final String? reviewNotes;
  final DateTime? submittedAt;
  final DateTime? closedAt;
  final DateTime createdAt;
  final DateTime updatedAt;

  const SubmissionEntity({
    required this.id,
    required this.entrepreneurId,
    required this.title,
    required this.summary,
    required this.sector,
    required this.stage,
    this.targetAmount,
    required this.currency,
    required this.problem,
    required this.solution,
    required this.businessModel,
    required this.financials,
    required this.documents,
    this.aiScore,
    this.aiAnalysis,
    required this.currentStep,
    required this.status,
    this.reviewNotes,
    this.submittedAt,
    this.closedAt,
    required this.createdAt,
    required this.updatedAt,
  });

  factory SubmissionEntity.fromJson(Map<String, dynamic> json) {
    return SubmissionEntity(
      id: (json['_id'] as String?) ?? (json['id'] as String?) ?? '',
      entrepreneurId: (json['entrepreneurId'] as String?) ?? '',
      title: (json['title'] as String?) ?? '',
      summary: (json['summary'] as String?) ?? '',
      sector: (json['sector'] as String?) ?? '',
      stage: _parseStage(json['stage'] as String?),
      targetAmount: _parseNum(json['targetAmount'])?.toDouble(),
      currency: (json['currency'] as String?) ?? 'USD',
      problem:
          SubmissionProblem.fromJson(json['problem'] as Map<String, dynamic>?),
      solution: SubmissionSolution.fromJson(
          json['solution'] as Map<String, dynamic>?),
      businessModel: SubmissionBusinessModel.fromJson(
          json['businessModel'] as Map<String, dynamic>?),
      financials: SubmissionFinancials.fromJson(
          json['financials'] as Map<String, dynamic>?),
      documents: ((json['documents'] as List?) ?? [])
          .whereType<Map<String, dynamic>>()
          .map((doc) => SubmissionDocument.fromJson(doc))
          .toList(),
      aiScore: _parseNum(json['aiScore'])?.toDouble(),
      aiAnalysis: json['aiAnalysis'] as Map<String, dynamic>?,
      currentStep: ((json['currentStep'] as num?) ?? 1).toInt(),
      status: _parseStatus(json['status'] as String?),
      reviewNotes: json['reviewNotes'] as String?,
      submittedAt: _parseDate(json['submittedAt']),
      closedAt: _parseDate(json['closedAt']),
      createdAt: _parseDate(json['createdAt']) ?? DateTime.now(),
      updatedAt: _parseDate(json['updatedAt']) ?? DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() => {
        '_id': id,
        'entrepreneurId': entrepreneurId,
        'title': title,
        'summary': summary,
        'sector': sector,
        'stage': _stageToString(stage),
        if (targetAmount != null) 'targetAmount': targetAmount,
        'currency': currency,
        'problem': problem.toJson(),
        'solution': solution.toJson(),
        'businessModel': businessModel.toJson(),
        'financials': financials.toJson(),
        'documents': documents.map((d) => d.toJson()).toList(),
        if (aiScore != null) 'aiScore': aiScore,
        if (aiAnalysis != null) 'aiAnalysis': aiAnalysis,
        'currentStep': currentStep,
        'status': _statusToString(status),
        if (reviewNotes != null) 'reviewNotes': reviewNotes,
        if (submittedAt != null) 'submittedAt': submittedAt?.toIso8601String(),
        if (closedAt != null) 'closedAt': closedAt?.toIso8601String(),
        'createdAt': createdAt.toIso8601String(),
        'updatedAt': updatedAt.toIso8601String(),
      };

  @override
  List<Object?> get props => [
        id,
        entrepreneurId,
        title,
        summary,
        sector,
        stage,
        targetAmount,
        currency,
        problem,
        solution,
        businessModel,
        financials,
        documents,
        aiScore,
        aiAnalysis,
        currentStep,
        status,
        reviewNotes,
        submittedAt,
        closedAt,
        createdAt,
        updatedAt,
      ];
}

// Helper functions
SubmissionStage _parseStage(String? stage) {
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

SubmissionStatus _parseStatus(String? status) {
  switch (status) {
    case 'draft':
      return SubmissionStatus.draft;
    case 'submitted':
      return SubmissionStatus.submitted;
    case 'under_review':
    case 'underReview':
      return SubmissionStatus.underReview;
    case 'approved':
      return SubmissionStatus.approved;
    case 'rejected':
      return SubmissionStatus.rejected;
    case 'suspended':
      return SubmissionStatus.suspended;
    case 'matched':
      return SubmissionStatus.matched;
    case 'closed':
      return SubmissionStatus.closed;
    default:
      return SubmissionStatus.draft;
  }
}

String _stageToString(SubmissionStage stage) {
  switch (stage) {
    case SubmissionStage.mvp:
      return 'mvp';
    case SubmissionStage.earlyRevenue:
      return 'early-revenue';
    case SubmissionStage.scaling:
      return 'scaling';
  }
}

String _statusToString(SubmissionStatus status) {
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

DateTime? _parseDate(dynamic value) {
  if (value == null) return null;
  if (value is DateTime) return value;
  if (value is String) return DateTime.tryParse(value);
  return null;
}

num? _parseNum(dynamic value) {
  if (value == null) return null;
  if (value is num) return value;
  if (value is String) return num.tryParse(value);
  return null;
}
