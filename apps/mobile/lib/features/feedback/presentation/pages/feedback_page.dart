import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/theme/app_spacing.dart';
import '../../../../core/widgets/app_button.dart';
import '../../../../core/widgets/app_text_field.dart';
import '../bloc/feedback_bloc.dart';

class FeedbackPage extends StatefulWidget {
  const FeedbackPage({super.key});

  @override
  State<FeedbackPage> createState() => _FeedbackPageState();
}

class _FeedbackPageState extends State<FeedbackPage> {
  int _tab = 0;

  @override
  void initState() {
    super.initState();
    context.read<FeedbackBloc>().add(const FeedbackSummaryRequested());
    context.read<FeedbackBloc>().add(const FeedbackReceivedRequested());
  }

  void _submitDialog() {
    final toUserId = TextEditingController();
    final rating = TextEditingController(text: '5');
    final category = TextEditingController(text: 'overall');
    final comment = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Submit feedback'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              AppTextField(label: 'To User ID', controller: toUserId),
              AppSpacing.gapSm,
              AppTextField(label: 'Rating (1-5)', controller: rating, keyboardType: TextInputType.number),
              AppSpacing.gapSm,
              AppTextField(label: 'Category', controller: category),
              AppSpacing.gapSm,
              AppTextField(label: 'Comment', controller: comment, maxLines: 3),
            ],
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(ctx);
              context.read<FeedbackBloc>().add(
                    FeedbackSubmitRequested({
                      'toUserId': toUserId.text.trim(),
                      'rating': double.tryParse(rating.text.trim()) ?? 5,
                      'category': category.text.trim(),
                      'comment': comment.text.trim(),
                    }),
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
    final tabs = [
      _FeedbackList(kind: 'Received', selector: (s) => s.received),
      _FeedbackList(kind: 'Given', selector: (s) => s.given),
      _FeedbackSummary(),
    ];

    return Scaffold(
      appBar: AppBar(
        title: const Text('Feedback'),
        actions: [
          IconButton(icon: const Icon(Icons.add_comment_outlined), onPressed: _submitDialog),
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              context.read<FeedbackBloc>().add(const FeedbackSummaryRequested());
              context.read<FeedbackBloc>().add(const FeedbackReceivedRequested());
              context.read<FeedbackBloc>().add(const FeedbackGivenRequested());
            },
          ),
        ],
      ),
      body: SafeArea(
        child: Padding(
          padding: AppSpacing.screenPadding,
          child: tabs[_tab],
        ),
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _tab,
        onDestinationSelected: (i) {
          setState(() => _tab = i);
          if (i == 0) context.read<FeedbackBloc>().add(const FeedbackReceivedRequested());
          if (i == 1) context.read<FeedbackBloc>().add(const FeedbackGivenRequested());
          if (i == 2) context.read<FeedbackBloc>().add(const FeedbackSummaryRequested());
        },
        destinations: const [
          NavigationDestination(icon: Icon(Icons.inbox_outlined), label: 'Received'),
          NavigationDestination(icon: Icon(Icons.outbox_outlined), label: 'Given'),
          NavigationDestination(icon: Icon(Icons.query_stats), label: 'Summary'),
        ],
      ),
    );
  }
}

class _FeedbackList extends StatelessWidget {
  final String kind;
  final List Function(FeedbackState) selector;
  const _FeedbackList({required this.kind, required this.selector});

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<FeedbackBloc, FeedbackState>(
      builder: (context, state) {
        if (state.isLoading && selector(state).isEmpty) {
          return const Center(child: CircularProgressIndicator());
        }
        if (state.status == FeedbackStatus.error) {
          return Center(child: Text(state.error ?? 'Failed to load $kind'));
        }
        final items = selector(state);
        if (items.isEmpty) return Center(child: Text('No $kind feedback.'));

        return ListView.builder(
          itemCount: items.length,
          itemBuilder: (context, i) {
            final f = items[i];
            return Card(
              child: ListTile(
                title: Text('Rating: ${f.rating ?? '-'}  ${f.category}'),
                subtitle: Text(f.comment),
              ),
            );
          },
        );
      },
    );
  }
}

class _FeedbackSummary extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return BlocBuilder<FeedbackBloc, FeedbackState>(
      builder: (context, state) {
        if (state.isLoading && state.summary == null) {
          return const Center(child: CircularProgressIndicator());
        }
        if (state.status == FeedbackStatus.error) {
          return Center(child: Text(state.error ?? 'Failed to load summary'));
        }
        final s = state.summary;
        if (s == null) return const Center(child: Text('No summary yet.'));
        return Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text('Summary'),
            AppSpacing.gapMd,
            Text(s.toString()),
            AppSpacing.gapMd,
            AppButton(
              text: 'Refresh',
              onPressed: () => context.read<FeedbackBloc>().add(const FeedbackSummaryRequested()),
            ),
          ],
        );
      },
    );
  }
}

