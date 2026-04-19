import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/theme/app_spacing.dart';
import '../../../../core/widgets/app_text_field.dart';
import '../bloc/milestones_bloc.dart';

class MilestonesPage extends StatefulWidget {
  const MilestonesPage({super.key});

  @override
  State<MilestonesPage> createState() => _MilestonesPageState();
}

class _MilestonesPageState extends State<MilestonesPage> {
  @override
  void initState() {
    super.initState();
    context.read<MilestonesBloc>().add(const MilestonesRequested());
  }

  void _createDialog() {
    final submissionId = TextEditingController();
    final matchResultId = TextEditingController();
    final title = TextEditingController();
    final amount = TextEditingController();
    final dueDate = TextEditingController(text: DateTime.now().add(const Duration(days: 14)).toIso8601String());

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Create milestone'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              AppTextField(label: 'Submission ID', controller: submissionId),
              AppSpacing.gapSm,
              AppTextField(label: 'MatchResult ID', controller: matchResultId),
              AppSpacing.gapSm,
              AppTextField(label: 'Title', controller: title),
              AppSpacing.gapSm,
              AppTextField(label: 'Amount', controller: amount, keyboardType: TextInputType.number),
              AppSpacing.gapSm,
              AppTextField(label: 'Due date (ISO)', controller: dueDate),
            ],
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(ctx);
              context.read<MilestonesBloc>().add(
                    MilestoneCreated({
                      'submissionId': submissionId.text.trim(),
                      'matchResultId': matchResultId.text.trim(),
                      'title': title.text.trim(),
                      'amount': double.tryParse(amount.text.trim()) ?? 0,
                      'dueDate': dueDate.text.trim(),
                    }),
                  );
            },
            child: const Text('Create'),
          ),
        ],
      ),
    );
  }

  void _evidenceDialog(String milestoneId) {
    final name = TextEditingController();
    final url = TextEditingController();
    final type = TextEditingController(text: 'report');

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Submit evidence'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            AppTextField(label: 'Name', controller: name),
            AppSpacing.gapSm,
            AppTextField(label: 'URL', controller: url),
            AppSpacing.gapSm,
            AppTextField(label: 'Type', controller: type),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(ctx);
              context.read<MilestonesBloc>().add(
                    MilestoneEvidenceSubmitted(
                      id: milestoneId,
                      payload: {
                        'evidenceDocuments': [
                          {'name': name.text.trim(), 'url': url.text.trim(), 'type': type.text.trim()},
                        ],
                      },
                    ),
                  );
            },
            child: const Text('Submit'),
          ),
        ],
      ),
    );
  }

  void _verifyDialog(String milestoneId) {
    final approved = ValueNotifier<bool>(true);
    final notes = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Verify milestone'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ValueListenableBuilder<bool>(
              valueListenable: approved,
              builder: (_, v, __) => SwitchListTile(
                value: v,
                onChanged: (nv) => approved.value = nv,
                title: const Text('Approved'),
              ),
            ),
            AppTextField(label: 'Notes', controller: notes, maxLines: 3),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(ctx);
              context.read<MilestonesBloc>().add(
                    MilestoneVerified(
                      id: milestoneId,
                      payload: {'approved': approved.value, 'notes': notes.text.trim()},
                    ),
                  );
            },
            child: const Text('Submit'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Milestones'),
        actions: [
          IconButton(icon: const Icon(Icons.add), onPressed: _createDialog),
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => context.read<MilestonesBloc>().add(const MilestonesRequested()),
          ),
        ],
      ),
      body: SafeArea(
        child: Padding(
          padding: AppSpacing.screenPadding,
          child: BlocBuilder<MilestonesBloc, MilestonesState>(
            builder: (context, state) {
              if (state.isLoading) return const Center(child: CircularProgressIndicator());
              if (state.status == MilestonesStatus.error) {
                return Center(child: Text(state.error ?? 'Failed to load milestones'));
              }
              if (state.items.isEmpty) return const Center(child: Text('No milestones.'));
              return ListView.separated(
                itemCount: state.items.length,
                separatorBuilder: (_, __) => AppSpacing.gapSm,
                itemBuilder: (context, i) {
                  final m = state.items[i];
                  return Card(
                    child: Padding(
                      padding: const EdgeInsets.all(12),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          Text(m.title.isEmpty ? 'Milestone' : m.title, style: Theme.of(context).textTheme.titleMedium),
                          AppSpacing.gapXs,
                          Text('Status: ${m.status}'),
                          if (m.amount != null) Text('Amount: ${m.amount} ${m.currency}'),
                          AppSpacing.gapSm,
                          Wrap(
                            spacing: 8,
                            children: [
                              OutlinedButton(
                                onPressed: m.id.isEmpty ? null : () => _evidenceDialog(m.id),
                                child: const Text('Evidence'),
                              ),
                              OutlinedButton(
                                onPressed: m.id.isEmpty ? null : () => _verifyDialog(m.id),
                                child: const Text('Verify'),
                              ),
                            ],
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

