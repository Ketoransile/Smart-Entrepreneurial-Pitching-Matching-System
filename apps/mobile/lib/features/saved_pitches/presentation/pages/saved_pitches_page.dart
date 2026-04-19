import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/theme/app_spacing.dart';
import '../bloc/saved_pitches_bloc.dart';

class SavedPitchesPage extends StatefulWidget {
  const SavedPitchesPage({super.key});

  @override
  State<SavedPitchesPage> createState() => _SavedPitchesPageState();
}

class _SavedPitchesPageState extends State<SavedPitchesPage> {
  @override
  void initState() {
    super.initState();
    context.read<SavedPitchesBloc>().add(const SavedPitchesRequested());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Saved pitches'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => context.read<SavedPitchesBloc>().add(const SavedPitchesRequested()),
          ),
        ],
      ),
      body: SafeArea(
        child: Padding(
          padding: AppSpacing.screenPadding,
          child: BlocBuilder<SavedPitchesBloc, SavedPitchesState>(
            builder: (context, state) {
              if (state.isLoading) return const Center(child: CircularProgressIndicator());
              if (state.status == SavedPitchesStatus.error) {
                return Center(child: Text(state.error ?? 'Failed to load saved pitches'));
              }
              if (state.items.isEmpty) return const Center(child: Text('No saved pitches.'));

              return ListView.separated(
                itemCount: state.items.length,
                separatorBuilder: (_, __) => AppSpacing.gapSm,
                itemBuilder: (context, i) {
                  final p = state.items[i];
                  return Card(
                    child: ListTile(
                      title: Text(p.title.isEmpty ? 'Untitled pitch' : p.title),
                      subtitle: Text('Sector: ${p.sector}  Stage: ${p.stage}'),
                      trailing: IconButton(
                        icon: const Icon(Icons.bookmark_remove_outlined),
                        onPressed: p.id.isEmpty
                            ? null
                            : () => context.read<SavedPitchesBloc>().add(SavedPitchToggled(p.id)),
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

