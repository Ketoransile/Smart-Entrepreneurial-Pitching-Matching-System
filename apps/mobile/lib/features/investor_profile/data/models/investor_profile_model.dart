import '../../domain/entities/investor_profile_entity.dart';

class InvestorProfileModel extends InvestorProfileEntity {
  const InvestorProfileModel({required super.data});

  factory InvestorProfileModel.fromJson(Map<String, dynamic> json) {
    return InvestorProfileModel(data: json);
  }
}

