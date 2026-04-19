import 'dart:io';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/theme/app_spacing.dart';
import '../bloc/documents_bloc.dart';

class DocumentsPage extends StatefulWidget {
  const DocumentsPage({super.key});

  @override
  State<DocumentsPage> createState() => _DocumentsPageState();
}

class _DocumentsPageState extends State<DocumentsPage> {
  String _type = 'pitch_deck';

  @override
  void initState() {
    super.initState();
    context.read<DocumentsBloc>().add(const DocumentsRequested());
  }

  Future<void> _pickAndUpload() async {
    final result = await FilePicker.platform.pickFiles(withData: false);
    final path = result?.files.single.path;
    if (path == null) return;

    context.read<DocumentsBloc>().add(
          DocumentUploadRequested(
            file: File(path),
            type: _type,
          ),
        );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Documents'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => context.read<DocumentsBloc>().add(const DocumentsRequested()),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _pickAndUpload,
        child: const Icon(Icons.upload_file),
      ),
      body: SafeArea(
        child: Padding(
          padding: AppSpacing.screenPadding,
          child: Column(
            children: [
              Row(
                children: [
                  const Text('Type:'),
                  const SizedBox(width: 12),
                  DropdownButton<String>(
                    value: _type,
                    items: const [
                      DropdownMenuItem(value: 'pitch_deck', child: Text('Pitch deck')),
                      DropdownMenuItem(value: 'financial_model', child: Text('Financial model')),
                      DropdownMenuItem(value: 'legal', child: Text('Legal')),
                      DropdownMenuItem(value: 'other', child: Text('Other')),
                    ],
                    onChanged: (v) => setState(() => _type = v ?? 'pitch_deck'),
                  ),
                ],
              ),
              AppSpacing.gapMd,
              Expanded(
                child: BlocBuilder<DocumentsBloc, DocumentsState>(
                  builder: (context, state) {
                    if (state.isLoading) {
                      return const Center(child: CircularProgressIndicator());
                    }
                    if (state.status == DocumentsStatus.error) {
                      return Center(child: Text(state.error ?? 'Failed to load documents'));
                    }
                    if (state.items.isEmpty) {
                      return const Center(child: Text('No documents yet.'));
                    }
                    return ListView.separated(
                      itemCount: state.items.length,
                      separatorBuilder: (_, __) => AppSpacing.gapSm,
                      itemBuilder: (context, i) {
                        final d = state.items[i];
                        return Card(
                          child: ListTile(
                            title: Text(d.filename.isEmpty ? d.id : d.filename),
                            subtitle: Text('Type: ${d.type}  Status: ${d.status}'),
                            trailing: IconButton(
                              icon: const Icon(Icons.delete_outline),
                              onPressed: d.id.isEmpty
                                  ? null
                                  : () => context
                                      .read<DocumentsBloc>()
                                      .add(DocumentDeleteRequested(d.id)),
                            ),
                            onTap: d.id.isEmpty
                                ? null
                                : () => context
                                    .read<DocumentsBloc>()
                                    .add(DocumentValidationRequested(d.id)),
                          ),
                        );
                      },
                    );
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

