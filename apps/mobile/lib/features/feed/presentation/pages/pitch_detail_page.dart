import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/theme/app_spacing.dart';
import '../../../../core/di/injection_container.dart';
import '../../../saved_pitches/presentation/bloc/saved_pitches_bloc.dart';
import '../bloc/feed_bloc.dart';

class PitchDetailPage extends StatefulWidget {
  final String pitchId;
  const PitchDetailPage({super.key, required this.pitchId});

  @override
  State<PitchDetailPage> createState() => _PitchDetailPageState();
}

class _PitchDetailPageState extends State<PitchDetailPage> {
  @override
  void initState() {
    super.initState();
    context.read<FeedBloc>().add(PitchRequested(widget.pitchId));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Pitch')),
      body: SafeArea(
        child: Padding(
          padding: AppSpacing.screenPadding,
          child: BlocBuilder<FeedBloc, FeedState>(
            builder: (context, state) {
              if (state.isLoading) return const Center(child: CircularProgressIndicator());
              if (state.status == FeedStatus.error) {
                return Center(child: Text(state.error ?? 'Failed to load pitch'));
              }
              final p = state.pitch;
              if (p == null) return const Center(child: Text('Pitch not found.'));

              return Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    p.title.isEmpty ? 'Untitled pitch' : p.title,
                    style: Theme.of(context).textTheme.headlineSmall,
                  ),
                  AppSpacing.gapSm,
                  Text('Sector: ${p.sector}'),
                  Text('Stage: ${p.stage}'),
                  if (p.targetAmount != null) Text('Target: ${p.targetAmount}'),
                  AppSpacing.gapLg,
                  ElevatedButton(
                    onPressed: () async {
                      final tempBloc = sl<SavedPitchesBloc>();
                      tempBloc.add(SavedPitchToggled(widget.pitchId));
                      await tempBloc.stream.firstWhere(
                        (s) => s.status != SavedPitchesStatus.loading,
                      );
                      await tempBloc.close();
                      if (mounted) Navigator.pop(context);
                    },
                    child: const Text('Toggle save'),
                  ),
                ],
              );
            },
          ),
        ),
      ),
    );
  }
}

