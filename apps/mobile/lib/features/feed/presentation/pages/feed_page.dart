import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/theme/app_spacing.dart';
import '../../../../core/di/injection_container.dart';
import '../../../saved_pitches/presentation/bloc/saved_pitches_bloc.dart';
import '../../../saved_pitches/presentation/pages/saved_pitches_page.dart';
import '../bloc/feed_bloc.dart';
import 'pitch_detail_page.dart';

class FeedPage extends StatefulWidget {
  const FeedPage({super.key});

  @override
  State<FeedPage> createState() => _FeedPageState();
}

class _FeedPageState extends State<FeedPage> {
  @override
  void initState() {
    super.initState();
    context.read<FeedBloc>().add(const FeedRequested(sort: 'recent', page: 1, limit: 20));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Investor feed'),
        actions: [
          IconButton(
            icon: const Icon(Icons.bookmark_outline),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => BlocProvider(
                    create: (_) => sl<SavedPitchesBloc>(),
                    child: const SavedPitchesPage(),
                  ),
                ),
              );
            },
            tooltip: 'Saved pitches',
          ),
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => context
                .read<FeedBloc>()
                .add(const FeedRequested(sort: 'recent', page: 1, limit: 20)),
          ),
        ],
      ),
      body: SafeArea(
        child: Padding(
          padding: AppSpacing.screenPadding,
          child: BlocBuilder<FeedBloc, FeedState>(
            builder: (context, state) {
              if (state.isLoading) return const Center(child: CircularProgressIndicator());
              if (state.status == FeedStatus.error) {
                return Center(child: Text(state.error ?? 'Failed to load feed'));
              }
              if (state.items.isEmpty) {
                return const Center(child: Text('No pitches available.'));
              }
              return ListView.separated(
                itemCount: state.items.length,
                separatorBuilder: (_, __) => AppSpacing.gapSm,
                itemBuilder: (context, i) {
                  final p = state.items[i];
                  return Card(
                    child: ListTile(
                      title: Text(p.title.isEmpty ? 'Untitled pitch' : p.title),
                      subtitle: Text('Sector: ${p.sector}  Stage: ${p.stage}'),
                      onTap: p.id.isEmpty
                          ? null
                          : () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (_) => BlocProvider.value(
                                    value: context.read<FeedBloc>(),
                                    child: PitchDetailPage(pitchId: p.id),
                                  ),
                                ),
                              );
                            },
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

