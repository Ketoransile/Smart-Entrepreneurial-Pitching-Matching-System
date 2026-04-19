import '../../domain/entities/invitation_entity.dart';

class InvitationModel extends InvitationEntity {
  const InvitationModel({required super.data});

  factory InvitationModel.fromJson(Map<String, dynamic> json) {
    return InvitationModel(data: json);
  }
}

