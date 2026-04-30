import 'dart:io';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/widgets/widgets.dart';
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

  void _reload() {
    context.read<DocumentsBloc>().add(const DocumentsRequested());
  }

  Future<void> _pickAndUpload() async {
    final result = await FilePicker.pickFiles(withData: false);
    final path = result?.files.single.path;
    if (path == null) return;

    if (!mounted) return;
    context.read<DocumentsBloc>().add(
          DocumentUploadRequested(
            file: File(path),
            type: _type,
          ),
        );
  }

  static const _types = <({String value, String label})>[
    (value: 'pitch_deck', label: 'Deck'),
    (value: 'financial_model', label: 'Model'),
    (value: 'legal', label: 'Legal'),
    (value: 'other', label: 'Other'),
  ];

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Documents',
              style: theme.textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.w800,
              ),
            ),
            Text(
              'Uploads & validation',
              style: theme.textTheme.bodySmall?.copyWith(
                color: AppColors.mutedForeground,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            tooltip: 'Refresh',
            onPressed: _reload,
            icon: const Icon(Icons.refresh_rounded),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _pickAndUpload,
        icon: const Icon(Icons.upload_file_rounded),
        label: const Text('Upload'),
      ),
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Padding(
              padding: AppSpacing.screenPadding.copyWith(bottom: 0),
              child: Text(
                'Choose a file type, then upload. You can request validation on any listed document.',
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: AppColors.mutedForeground,
                  height: 1.4,
                ),
              ),
            ),
            AppSpacing.gapMd,
            Padding(
              padding: AppSpacing.screenPaddingHorizontal,
              child: SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: _types
                      .map(
                        (t) => Padding(
                          padding: const EdgeInsets.only(right: AppSpacing.sm),
                          child: _TypeChip(
                            label: t.label,
                            selected: _type == t.value,
                            onTap: () => setState(() => _type = t.value),
                          ),
                        ),
                      )
                      .toList(),
                ),
              ),
            ),
            AppSpacing.gapMd,
            Expanded(
              child: BlocBuilder<DocumentsBloc, DocumentsState>(
                builder: (context, state) {
                  if (state.isLoading) {
                    return const Center(child: CircularProgressIndicator());
                  }
                  if (state.status == DocumentsStatus.error) {
                    return EmptyStateView(
                      icon: Icons.folder_off_outlined,
                      title: 'Could not load documents',
                      message: state.error ?? 'Please try again.',
                      actionLabel: 'Retry',
                      onAction: _reload,
                    );
                  }
                  if (state.items.isEmpty) {
                    return EmptyStateView(
                      icon: Icons.upload_file_rounded,
                      title: 'No documents yet',
                      message:
                          'Upload your pitch deck, financials, or legal files to keep investors in the loop.',
                      actionLabel: 'Upload file',
                      onAction: _pickAndUpload,
                    );
                  }

                  return RefreshIndicator(
                    onRefresh: () async => _reload(),
                    child: ListView.separated(
                      physics: const AlwaysScrollableScrollPhysics(),
                      padding: AppSpacing.screenPadding.copyWith(bottom: 120),
                      itemCount: state.items.length,
                      separatorBuilder: (_, __) => AppSpacing.gapMd,
                      itemBuilder: (context, i) {
                        final d = state.items[i];
                        return Material(
                          color: AppColors.card,
                          elevation: 0,
                          shape: RoundedRectangleBorder(
                            borderRadius:
                                BorderRadius.circular(AppSpacing.radiusLg),
                            side: const BorderSide(color: AppColors.border),
                          ),
                          child: Padding(
                            padding: AppSpacing.paddingMd,
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                DecoratedBox(
                                  decoration: BoxDecoration(
                                    color: AppColors.primary
                                        .withValues(alpha: 0.1),
                                    borderRadius: BorderRadius.circular(
                                      AppSpacing.radiusMd,
                                    ),
                                  ),
                                  child: const Padding(
                                    padding: EdgeInsets.all(10),
                                    child: Icon(
                                      Icons.insert_drive_file_outlined,
                                      color: AppColors.primary,
                                      size: 22,
                                    ),
                                  ),
                                ),
                                const SizedBox(width: AppSpacing.md),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        d.filename.isEmpty ? d.id : d.filename,
                                        style: theme.textTheme.titleSmall
                                            ?.copyWith(
                                          fontWeight: FontWeight.w700,
                                        ),
                                      ),
                                      AppSpacing.gapXs,
                                      Text(
                                        'Type: ${d.type}  ·  Status: ${d.status}',
                                        style: theme.textTheme.bodySmall
                                            ?.copyWith(
                                          color: AppColors.mutedForeground,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                IconButton(
                                  tooltip: 'Validate',
                                  icon: const Icon(
                                    Icons.fact_check_outlined,
                                  ),
                                  onPressed: d.id.isEmpty
                                      ? null
                                      : () => context
                                          .read<DocumentsBloc>()
                                          .add(
                                            DocumentValidationRequested(d.id),
                                          ),
                                ),
                                IconButton(
                                  tooltip: 'Delete',
                                  icon: const Icon(Icons.delete_outline_rounded),
                                  style: IconButton.styleFrom(
                                    foregroundColor: AppColors.destructive,
                                  ),
                                  onPressed: d.id.isEmpty
                                      ? null
                                      : () => context
                                          .read<DocumentsBloc>()
                                          .add(
                                            DocumentDeleteRequested(d.id),
                                          ),
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _TypeChip extends StatelessWidget {
  const _TypeChip({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: selected
          ? Theme.of(context).colorScheme.primary.withValues(alpha: 0.14)
          : AppColors.muted,
      borderRadius: BorderRadius.circular(AppSpacing.radiusFull),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(AppSpacing.radiusFull),
        child: Padding(
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.md,
            vertical: AppSpacing.sm,
          ),
          child: Text(
            label,
            style: Theme.of(context).textTheme.labelLarge?.copyWith(
                  fontWeight: FontWeight.w700,
                  color: selected
                      ? Theme.of(context).colorScheme.primary
                      : AppColors.mutedForeground,
                ),
          ),
        ),
      ),
    );
  }
}
