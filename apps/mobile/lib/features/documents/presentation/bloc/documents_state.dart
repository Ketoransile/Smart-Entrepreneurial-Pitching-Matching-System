part of 'documents_bloc.dart';

enum DocumentsStatus { initial, loading, loaded, validationLoaded, error }

class DocumentsState extends Equatable {
  final DocumentsStatus status;
  final List<DocumentEntity> items;
  final Map<String, dynamic>? validation;
  final String? error;

  const DocumentsState({
    required this.status,
    this.items = const [],
    this.validation,
    this.error,
  });

  const DocumentsState.initial()
      : status = DocumentsStatus.initial,
        items = const [],
        validation = null,
        error = null;

  DocumentsState copyWith({
    DocumentsStatus? status,
    List<DocumentEntity>? items,
    Map<String, dynamic>? validation,
    String? error,
  }) {
    return DocumentsState(
      status: status ?? this.status,
      items: items ?? this.items,
      validation: validation ?? this.validation,
      error: error,
    );
  }

  bool get isLoading => status == DocumentsStatus.loading;

  @override
  List<Object?> get props => [status, items, validation, error];
}

