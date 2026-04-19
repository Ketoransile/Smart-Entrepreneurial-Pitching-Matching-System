import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/theme/app_spacing.dart';
import '../../../../core/di/injection_container.dart';
import '../../../invitations/presentation/bloc/send_invitation_bloc.dart';
import '../../../invitations/presentation/pages/send_invitation_page.dart';
import '../bloc/matching_bloc.dart';

class MatchResultsPage extends StatefulWidget {
  final String submissionId;
  const MatchResultsPage({super.key, required this.submissionId});

  @override
  State<MatchResultsPage> createState() => _MatchResultsPageState();
}

class _MatchResultsPageState extends State<MatchResultsPage> {
  @override
  void initState() {
    super.initState();
    context.read<MatchingBloc>().add(MatchingResultsRequested(widget.submissionId));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Match results'),
        actions: [
          IconButton(
            icon: const Icon(Icons.play_arrow),
            onPressed: () {
              context.read<MatchingBloc>().add(MatchingRunRequested(widget.submissionId));
            },
            tooltip: 'Run matching',
          ),
        ],
      ),
      body: SafeArea(
        child: Padding(
          padding: AppSpacing.screenPadding,
          child: BlocBuilder<MatchingBloc, MatchingState>(
            builder: (context, state) {
              if (state.isLoading) {
                return const Center(child: CircularProgressIndicator());
              }
              if (state.status == MatchingStatus.error) {
                return Center(child: Text(state.error ?? 'Failed to load results'));
              }
              if (state.results.isEmpty) {
                return const Center(child: Text('No matches yet. Tap ▶ to run.'));
              }
              return ListView.separated(
                itemCount: state.results.length,
                separatorBuilder: (_, __) => AppSpacing.gapSm,
                itemBuilder: (context, i) {
                  final r = state.results[i];
                  return Card(
                    child: Padding(
                      padding: const EdgeInsets.all(12),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          Text(
                            r.investorName.isEmpty ? 'Investor' : r.investorName,
                            style: Theme.of(context).textTheme.titleMedium,
                          ),
                          AppSpacing.gapXs,
                          Text('Score: ${r.score?.toStringAsFixed(2) ?? '-'}'),
                          Text('Status: ${r.status}'),
                          AppSpacing.gapSm,
                          Text('Match ID: ${r.id}'),
                          if (r.status == 'accepted') ...[
                            AppSpacing.gapSm,
                            ElevatedButton(
                              onPressed: r.id.isEmpty
                                  ? null
                                  : () {
                                      Navigator.push(
                                        context,
                                        MaterialPageRoute(
                                          builder: (_) => BlocProvider(
                                            create: (_) => sl<SendInvitationBloc>(),
                                            child: SendInvitationPage(matchId: r.id),
                                          ),
                                        ),
                                      );
                                    },
                              child: const Text('Send invitation'),
                            ),
                          ],
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

