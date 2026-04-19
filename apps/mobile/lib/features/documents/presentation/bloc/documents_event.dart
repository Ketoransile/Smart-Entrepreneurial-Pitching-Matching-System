part of 'documents_bloc.dart';

abstract class DocumentsEvent extends Equatable {
  const DocumentsEvent();
  @override
  List<Object?> get props => [];
}

class DocumentsRequested extends DocumentsEvent {
  const DocumentsRequested();
}

class DocumentUploadRequested extends DocumentsEvent {
  final File file;
  final String type;
  final String? submissionId;

  const DocumentUploadRequested({
    required this.file,
    required this.type,
    this.submissionId,
  });

  @override
  List<Object?> get props => [file.path, type, submissionId];
}

class DocumentDeleteRequested extends DocumentsEvent {
  final String id;
  const DocumentDeleteRequested(this.id);
  @override
  List<Object?> get props => [id];
}

class DocumentValidationRequested extends DocumentsEvent {
  final String id;
  const DocumentValidationRequested(this.id);
  @override
  List<Object?> get props => [id];
}

