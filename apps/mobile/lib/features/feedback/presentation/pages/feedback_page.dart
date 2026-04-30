import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/widgets/widgets.dart';
import '../bloc/feedback_bloc.dart';

class FeedbackPage extends StatefulWidget {
  const FeedbackPage({super.key});

  @override
  State<FeedbackPage> createState() => _FeedbackPageState();
}

class _FeedbackPageState extends State<FeedbackPage>
    with SingleTickerProviderStateMixin {
  late final TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _tabController.addListener(_onTabChanged);
    context.read<FeedbackBloc>().add(const FeedbackSummaryRequested());
    context.read<FeedbackBloc>().add(const FeedbackReceivedRequested());
  }

  void _onTabChanged() {
    if (_tabController.indexIsChanging) return;
    switch (_tabController.index) {
      case 0:
        context.read<FeedbackBloc>().add(const FeedbackReceivedRequested());
        break;
      case 1:
        context.read<FeedbackBloc>().add(const FeedbackGivenRequested());
        break;
      case 2:
        context.read<FeedbackBloc>().add(const FeedbackSummaryRequested());
        break;
    }
  }

  @override
  void dispose() {
    _tabController.removeListener(_onTabChanged);
    _tabController.dispose();
    super.dispose();
  }

  void _submitDialog() {
    final toUserId = TextEditingController();
    final rating = TextEditingController(text: '5');
    final category = TextEditingController(text: 'overall');
    final comment = TextEditingController();

    showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Submit feedback'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              AppTextField(label: 'To User ID', controller: toUserId),
              AppSpacing.gapSm,
              AppTextField(
                label: 'Rating (1-5)',
                controller: rating,
                keyboardType: TextInputType.number,
              ),
              AppSpacing.gapSm,
              AppTextField(label: 'Category', controller: category),
              AppSpacing.gapSm,
              AppTextField(
                label: 'Comment',
                controller: comment,
                maxLines: 3,
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          FilledButton(
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

  void _refreshAll() {
    context.read<FeedbackBloc>().add(const FeedbackSummaryRequested());
    context.read<FeedbackBloc>().add(const FeedbackReceivedRequested());
    context.read<FeedbackBloc>().add(const FeedbackGivenRequested());
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Feedback',
              style: theme.textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.w800,
              ),
            ),
            Text(
              'Reviews & summary',
              style: theme.textTheme.bodySmall?.copyWith(
                color: AppColors.mutedForeground,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
        bottom: TabBar(
          controller: _tabController,
          indicatorWeight: 3,
          labelStyle: theme.textTheme.labelLarge?.copyWith(
            fontWeight: FontWeight.w700,
          ),
          unselectedLabelColor: AppColors.mutedForeground,
          tabs: const [
            Tab(text: 'Received'),
            Tab(text: 'Given'),
            Tab(text: 'Summary'),
          ],
        ),
        actions: [
          IconButton(
            tooltip: 'Add feedback',
            icon: const Icon(Icons.add_comment_outlined),
            onPressed: _submitDialog,
          ),
          IconButton(
            tooltip: 'Refresh',
            icon: const Icon(Icons.refresh_rounded),
            onPressed: _refreshAll,
          ),
        ],
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _FeedbackList(kind: 'Received', selector: _receivedSelector),
          _FeedbackList(kind: 'Given', selector: _givenSelector),
          const _FeedbackSummary(),
        ],
      ),
    );
  }
}

List<dynamic> _receivedSelector(FeedbackState s) => s.received;
List<dynamic> _givenSelector(FeedbackState s) => s.given;

class _FeedbackList extends StatelessWidget {
  const _FeedbackList({
    required this.kind,
    required this.selector,
  });

  final String kind;
  final List<dynamic> Function(FeedbackState) selector;

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<FeedbackBloc, FeedbackState>(
      builder: (context, state) {
        if (state.isLoading && selector(state).isEmpty) {
          return const Center(child: CircularProgressIndicator());
        }
        if (state.status == FeedbackStatus.error) {
          return EmptyStateView(
            icon: Icons.chat_bubble_outline_rounded,
            title: 'Could not load $kind feedback',
            message: state.error ?? 'Try again.',
            actionLabel: 'Retry',
            onAction: () {
              if (kind == 'Received') {
                context
                    .read<FeedbackBloc>()
                    .add(const FeedbackReceivedRequested());
              } else {
                context.read<FeedbackBloc>().add(const FeedbackGivenRequested());
              }
            },
          );
        }
        final items = selector(state);
        if (items.isEmpty) {
          return EmptyStateView(
            icon: Icons.forum_outlined,
            title: 'No $kind feedback yet',
            message: 'When peers leave reviews, they will appear here.',
          );
        }

        return ListView.separated(
          padding: AppSpacing.screenPadding.copyWith(bottom: 24),
          itemCount: items.length,
          separatorBuilder: (_, __) => AppSpacing.gapMd,
          itemBuilder: (context, i) {
            final f = items[i];
            return Material(
              color: AppColors.card,
              elevation: 0,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
                side: const BorderSide(color: AppColors.border),
              ),
              child: Padding(
                padding: AppSpacing.paddingMd,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '${f.rating ?? '—'} · ${f.category}',
                      style: Theme.of(context).textTheme.titleSmall?.copyWith(
                            fontWeight: FontWeight.w700,
                          ),
                    ),
                    AppSpacing.gapSm,
                    Text(
                      f.comment,
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            height: 1.45,
                          ),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }
}

class _FeedbackSummary extends StatelessWidget {
  const _FeedbackSummary();

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<FeedbackBloc, FeedbackState>(
      builder: (context, state) {
        if (state.isLoading && state.summary == null) {
          return const Center(child: CircularProgressIndicator());
        }
        if (state.status == FeedbackStatus.error) {
          return EmptyStateView(
            icon: Icons.query_stats_rounded,
            title: 'Could not load summary',
            message: state.error ?? 'Try again.',
            actionLabel: 'Retry',
            onAction: () => context
                .read<FeedbackBloc>()
                .add(const FeedbackSummaryRequested()),
          );
        }
        final s = state.summary;
        if (s == null) {
          return const EmptyStateView(
            icon: Icons.insights_outlined,
            title: 'No summary yet',
            message:
                'Summary stats will show after you have more feedback.',
          );
        }
        return ListView(
          padding: AppSpacing.screenPadding,
          children: [
            Text(
              'Overview',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w800,
                  ),
            ),
            AppSpacing.gapMd,
            Material(
              color: AppColors.card,
              elevation: 0,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
                side: const BorderSide(color: AppColors.border),
              ),
              child: Padding(
                padding: AppSpacing.paddingMd,
                child: Text(
                  s.toString(),
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
              ),
            ),
            AppSpacing.gapLg,
            AppButton(
              text: 'Refresh summary',
              onPressed: () => context
                  .read<FeedbackBloc>()
                  .add(const FeedbackSummaryRequested()),
            ),
          ],
        );
      },
    );
  }
}
