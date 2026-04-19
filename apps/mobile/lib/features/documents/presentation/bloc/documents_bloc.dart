import 'dart:io';

import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../domain/entities/document_entity.dart';
import '../../domain/usecases/documents_usecases.dart';

part 'documents_event.dart';
part 'documents_state.dart';

class DocumentsBloc extends Bloc<DocumentsEvent, DocumentsState> {
  final ListMyDocumentsUseCase _list;
  final UploadDocumentUseCase _upload;
  final DeleteDocumentUseCase _delete;
  final DocumentValidationStatusUseCase _validation;

  DocumentsBloc({
    required ListMyDocumentsUseCase list,
    required UploadDocumentUseCase upload,
    required DeleteDocumentUseCase delete,
    required DocumentValidationStatusUseCase validation,
  })  : _list = list,
        _upload = upload,
        _delete = delete,
        _validation = validation,
        super(const DocumentsState.initial()) {
    on<DocumentsRequested>(_onList);
    on<DocumentUploadRequested>(_onUpload);
    on<DocumentDeleteRequested>(_onDelete);
    on<DocumentValidationRequested>(_onValidation);
  }

  Future<void> _onList(DocumentsRequested event, Emitter<DocumentsState> emit) async {
    emit(state.copyWith(status: DocumentsStatus.loading, error: null));
    final result = await _list();
    result.fold(
      (f) => emit(state.copyWith(status: DocumentsStatus.error, error: f.message)),
      (items) => emit(state.copyWith(status: DocumentsStatus.loaded, items: items)),
    );
  }

  Future<void> _onUpload(
    DocumentUploadRequested event,
    Emitter<DocumentsState> emit,
  ) async {
    emit(state.copyWith(status: DocumentsStatus.loading, error: null));
    final result = await _upload(file: event.file, type: event.type, submissionId: event.submissionId);
    result.fold(
      (f) => emit(state.copyWith(status: DocumentsStatus.error, error: f.message)),
      (_) => add(const DocumentsRequested()),
    );
  }

  Future<void> _onDelete(
    DocumentDeleteRequested event,
    Emitter<DocumentsState> emit,
  ) async {
    emit(state.copyWith(status: DocumentsStatus.loading, error: null));
    final result = await _delete(event.id);
    result.fold(
      (f) => emit(state.copyWith(status: DocumentsStatus.error, error: f.message)),
      (_) => add(const DocumentsRequested()),
    );
  }

  Future<void> _onValidation(
    DocumentValidationRequested event,
    Emitter<DocumentsState> emit,
  ) async {
    emit(state.copyWith(status: DocumentsStatus.loading, error: null));
    final result = await _validation(event.id);
    result.fold(
      (f) => emit(state.copyWith(status: DocumentsStatus.error, error: f.message)),
      (data) => emit(state.copyWith(
        status: DocumentsStatus.validationLoaded,
        validation: data,
      )),
    );
  }
}

