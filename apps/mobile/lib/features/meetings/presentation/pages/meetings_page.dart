import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/theme/app_spacing.dart';
import '../../../../core/widgets/app_button.dart';
import '../../../../core/widgets/app_text_field.dart';
import '../bloc/meetings_bloc.dart';

class MeetingsPage extends StatefulWidget {
  const MeetingsPage({super.key});

  @override
  State<MeetingsPage> createState() => _MeetingsPageState();
}

class _MeetingsPageState extends State<MeetingsPage> {
  String? _status;

  @override
  void initState() {
    super.initState();
    context.read<MeetingsBloc>().add(const MeetingsRequested());
  }

  void _scheduleDialog() {
    final title = TextEditingController();
    final when = TextEditingController(text: DateTime.now().add(const Duration(days: 1)).toIso8601String());
    final duration = TextEditingController(text: '30');
    final participants = TextEditingController();
    final meetingUrl = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Schedule meeting'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              AppTextField(label: 'Title', controller: title),
              AppSpacing.gapSm,
              AppTextField(label: 'ScheduledAt (ISO)', controller: when),
              AppSpacing.gapSm,
              AppTextField(label: 'Duration minutes', controller: duration, keyboardType: TextInputType.number),
              AppSpacing.gapSm,
              AppTextField(label: 'Participants (comma userIds)', controller: participants),
              AppSpacing.gapSm,
              AppTextField(label: 'Meeting URL (optional)', controller: meetingUrl),
            ],
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(ctx);
              final ids = participants.text
                  .split(',')
                  .map((e) => e.trim())
                  .where((e) => e.isNotEmpty)
                  .toList();
              context.read<MeetingsBloc>().add(
                    MeetingScheduled({
                      'title': title.text.trim(),
                      'scheduledAt': when.text.trim(),
                      'durationMinutes': int.tryParse(duration.text.trim()) ?? 30,
                      'participants': ids,
                      if (meetingUrl.text.trim().isNotEmpty) 'meetingUrl': meetingUrl.text.trim(),
                    }),
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
        title: const Text('Meetings'),
        actions: [
          DropdownButton<String?>(
            value: _status,
            underline: const SizedBox.shrink(),
            items: const [
              DropdownMenuItem(value: null, child: Text('Any')),
              DropdownMenuItem(value: 'scheduled', child: Text('Scheduled')),
              DropdownMenuItem(value: 'ongoing', child: Text('Ongoing')),
              DropdownMenuItem(value: 'completed', child: Text('Completed')),
              DropdownMenuItem(value: 'cancelled', child: Text('Cancelled')),
            ],
            onChanged: (v) {
              setState(() => _status = v);
              context.read<MeetingsBloc>().add(MeetingsRequested(status: _status));
            },
          ),
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: _scheduleDialog,
          ),
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => context.read<MeetingsBloc>().add(MeetingsRequested(status: _status)),
          ),
        ],
      ),
      body: SafeArea(
        child: Padding(
          padding: AppSpacing.screenPadding,
          child: BlocBuilder<MeetingsBloc, MeetingsState>(
            builder: (context, state) {
              if (state.isLoading) return const Center(child: CircularProgressIndicator());
              if (state.status == MeetingsStatus.error) {
                return Center(child: Text(state.error ?? 'Failed to load meetings'));
              }
              if (state.items.isEmpty) return const Center(child: Text('No meetings.'));

              return ListView.separated(
                itemCount: state.items.length,
                separatorBuilder: (_, __) => AppSpacing.gapSm,
                itemBuilder: (context, i) {
                  final m = state.items[i];
                  final when = m.scheduledAt?.toLocal().toString() ?? '';
                  return Card(
                    child: Padding(
                      padding: const EdgeInsets.all(12),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          Text(m.title.isEmpty ? 'Meeting' : m.title, style: Theme.of(context).textTheme.titleMedium),
                          AppSpacing.gapXs,
                          Text('Status: ${m.status}'),
                          if (when.isNotEmpty) Text('At: $when'),
                          if (m.meetingUrl.isNotEmpty) Text('URL: ${m.meetingUrl}'),
                          AppSpacing.gapSm,
                          Row(
                            children: [
                              Expanded(
                                child: OutlinedButton(
                                  onPressed: (m.id.isEmpty) ? null : () {
                                    context.read<MeetingsBloc>().add(
                                          MeetingStatusUpdated(
                                            meetingId: m.id,
                                            payload: {'status': 'completed'},
                                          ),
                                        );
                                  },
                                  child: const Text('Complete'),
                                ),
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: OutlinedButton(
                                  onPressed: (m.id.isEmpty) ? null : () {
                                    context.read<MeetingsBloc>().add(
                                          MeetingStatusUpdated(
                                            meetingId: m.id,
                                            payload: {'status': 'cancelled'},
                                          ),
                                        );
                                  },
                                  child: const Text('Cancel'),
                                ),
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

