import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/theme/app_spacing.dart';
import '../../../../core/widgets/app_button.dart';
import '../../../../core/widgets/app_text_field.dart';
import '../../../../core/di/injection_container.dart';
import '../../../matching/presentation/bloc/matching_bloc.dart';
import '../../../matching/presentation/pages/match_results_page.dart';
import '../bloc/submissions_bloc.dart';

class MySubmissionsPage extends StatefulWidget {
  const MySubmissionsPage({super.key});

  @override
  State<MySubmissionsPage> createState() => _MySubmissionsPageState();
}

class _MySubmissionsPageState extends State<MySubmissionsPage> {
  @override
  void initState() {
    super.initState();
    context.read<SubmissionsBloc>().add(const MySubmissionsRequested());
  }

  void _createDraftDialog() {
    final title = TextEditingController();
    final sector = TextEditingController();
    final stage = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('New pitch draft'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              AppTextField(label: 'Title', controller: title),
              AppSpacing.gapSm,
              AppTextField(label: 'Sector', controller: sector),
              AppSpacing.gapSm,
              AppTextField(
                label: 'Stage',
                hint: 'idea / mvp / early-revenue / scaling',
                controller: stage,
              ),
            ],
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(ctx);
              context.read<SubmissionsBloc>().add(
                    SubmissionDraftCreated(
                      title: title.text.trim(),
                      sector: sector.text.trim(),
                      stage: stage.text.trim(),
                    ),
                  );
            },
            child: const Text('Create'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My pitches'),
        actions: [
          IconButton(
            onPressed: () => context.read<SubmissionsBloc>().add(const MySubmissionsRequested()),
            icon: const Icon(Icons.refresh),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _createDraftDialog,
        child: const Icon(Icons.add),
      ),
      body: SafeArea(
        child: Padding(
          padding: AppSpacing.screenPadding,
          child: BlocBuilder<SubmissionsBloc, SubmissionsState>(
            builder: (context, state) {
              if (state.isLoading) {
                return const Center(child: CircularProgressIndicator());
              }
              if (state.status == SubmissionsStatus.error) {
                return Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Text(
                      state.error ?? 'Failed to load submissions',
                      style: TextStyle(color: Theme.of(context).colorScheme.error),
                    ),
                    AppSpacing.gapMd,
                    AppButton(
                      text: 'Retry',
                      onPressed: () => context
                          .read<SubmissionsBloc>()
                          .add(const MySubmissionsRequested()),
                    ),
                  ],
                );
              }
              if (state.items.isEmpty) {
                return const Center(child: Text('No submissions yet.'));
              }

              return ListView.separated(
                itemCount: state.items.length,
                separatorBuilder: (_, __) => AppSpacing.gapSm,
                itemBuilder: (context, i) {
                  final s = state.items[i];
                  return Card(
                    child: Padding(
                      padding: const EdgeInsets.all(12),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          Text(
                            s.title.isEmpty ? 'Untitled pitch' : s.title,
                            style: Theme.of(context).textTheme.titleMedium,
                          ),
                          AppSpacing.gapXs,
                          Text('Stage: ${s.stage}  Sector: ${s.sector}'),
                          Text('Status: ${s.status}'),
                          AppSpacing.gapSm,
                          Row(
                            children: [
                              Expanded(
                                child: OutlinedButton(
                                  onPressed: s.id.isEmpty
                                      ? null
                                      : () => context.read<SubmissionsBloc>().add(
                                            SubmissionCompletenessRequested(s.id),
                                          ),
                                  child: const Text('Completeness'),
                                ),
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: ElevatedButton(
                                  onPressed: s.id.isEmpty
                                      ? null
                                      : () => context
                                          .read<SubmissionsBloc>()
                                          .add(SubmissionSubmitted(s.id)),
                                  child: const Text('Submit'),
                                ),
                              ),
                            ],
                          ),
                          AppSpacing.gapXs,
                          OutlinedButton(
                            onPressed: s.id.isEmpty
                                ? null
                                : () {
                                    Navigator.push(
                                      context,
                                      MaterialPageRoute(
                                        builder: (_) => BlocProvider<MatchingBloc>(
                                          create: (_) => sl<MatchingBloc>(),
                                          child: MatchResultsPage(submissionId: s.id),
                                        ),
                                      ),
                                    );
                                  },
                            child: const Text('Matching results'),
                          ),
                          AppSpacing.gapXs,
                          TextButton(
                            onPressed: s.id.isEmpty
                                ? null
                                : () => context
                                    .read<SubmissionsBloc>()
                                    .add(SubmissionDraftDeleted(s.id)),
                            child: const Text('Delete draft'),
                          ),
                        ],
                      ),
                    ),
                  );
                },
              );
            },
          ),
        ),
      ),
    );
  }
}

