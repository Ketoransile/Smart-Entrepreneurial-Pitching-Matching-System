import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/di/injection_container.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/widgets/app_button.dart';
import '../../../../core/widgets/app_text_field.dart';
import '../../../documents/presentation/bloc/documents_bloc.dart';
import '../../../documents/presentation/pages/documents_page.dart';
import '../../../feedback/presentation/bloc/feedback_bloc.dart';
import '../../../feedback/presentation/pages/feedback_page.dart';
import '../../../invitations/presentation/bloc/invitations_bloc.dart';
import '../../../invitations/presentation/pages/invitations_page.dart';
import '../../../meetings/presentation/bloc/meetings_bloc.dart';
import '../../../meetings/presentation/pages/meetings_page.dart';
import '../../../milestones/presentation/bloc/milestones_bloc.dart';
import '../../../milestones/presentation/pages/milestones_page.dart';
import '../bloc/investor_profile_bloc.dart';

class InvestorProfilePage extends StatefulWidget {
  const InvestorProfilePage({super.key});

  @override
  State<InvestorProfilePage> createState() => _InvestorProfilePageState();
}

class _InvestorProfilePageState extends State<InvestorProfilePage> {
  final _formKey = GlobalKey<FormState>();
  final _fullName = TextEditingController();
  final _sectors = TextEditingController();
  final _stages = TextEditingController();
  final _min = TextEditingController();
  final _max = TextEditingController();
  final _types = TextEditingController();

  @override
  void initState() {
    super.initState();
    context.read<InvestorProfileBloc>().add(const InvestorProfileRequested());
  }

  @override
  void dispose() {
    _fullName.dispose();
    _sectors.dispose();
    _stages.dispose();
    _min.dispose();
    _max.dispose();
    _types.dispose();
    super.dispose();
  }

  Map<String, dynamic> _payload() {
    final sectors = _sectors.text
        .split(',')
        .map((e) => e.trim())
        .where((e) => e.isNotEmpty)
        .toList();
    final stages = _stages.text
        .split(',')
        .map((e) => e.trim())
        .where((e) => e.isNotEmpty)
        .toList();
    final types = _types.text
        .split(',')
        .map((e) => e.trim())
        .where((e) => e.isNotEmpty)
        .toList();

    final min = int.tryParse(_min.text.trim());
    final max = int.tryParse(_max.text.trim());

    return {
      'fullName': _fullName.text.trim(),
      'preferredSectors': sectors,
      'preferredStages': stages,
      'investmentRange': {'min': min ?? 0, 'max': max ?? 0},
      'investmentType': types,
    };
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Investor Profile'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => context.read<InvestorProfileBloc>().add(const InvestorProfileRequested()),
          ),
        ],
      ),
      body: SafeArea(
        child: Padding(
          padding: AppSpacing.screenPadding,
          child: BlocConsumer<InvestorProfileBloc, InvestorProfileState>(
            listener: (context, state) {
              final p = state.profile;
              if (state.status == InvestorProfileStatus.loaded && p != null) {
                _fullName.text = p.fullName;
                _sectors.text = p.preferredSectors.join(', ');
                _stages.text = p.preferredStages.join(', ');
              }
            },
            builder: (context, state) {
              if (state.isLoading) return const Center(child: CircularProgressIndicator());
              if (state.status == InvestorProfileStatus.error) {
                return Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Text(
                      state.error ?? 'Failed to load profile',
                      style: TextStyle(color: Theme.of(context).colorScheme.error),
                    ),
                    AppSpacing.gapMd,
                    AppButton(
                      text: 'Create profile',
                      onPressed: () => context
                          .read<InvestorProfileBloc>()
                          .add(InvestorProfileCreateRequested(_payload())),
                    ),
                  ],
                );
              }

              return Form(
                key: _formKey,
                child: ListView(
                  children: [
                    AppTextField(
                      label: 'Full name',
                      controller: _fullName,
                      validator: (v) => (v == null || v.trim().isEmpty) ? 'Required' : null,
                    ),
                    AppSpacing.gapMd,
                    AppTextField(
                      label: 'Preferred sectors (comma separated)',
                      controller: _sectors,
                    ),
                    AppSpacing.gapMd,
                    AppTextField(
                      label: 'Preferred stages (comma separated)',
                      hint: 'idea, mvp, early-revenue, scaling',
                      controller: _stages,
                    ),
                    AppSpacing.gapMd,
                    Row(
                      children: [
                        Expanded(
                          child: AppTextField(
                            label: 'Min',
                            controller: _min,
                            keyboardType: TextInputType.number,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: AppTextField(
                            label: 'Max',
                            controller: _max,
                            keyboardType: TextInputType.number,
                          ),
                        ),
                      ],
                    ),
                    AppSpacing.gapMd,
                    AppTextField(
                      label: 'Investment types (comma separated)',
                      controller: _types,
                    ),
                    AppSpacing.gapLg,
                    AppButton(
                      text: 'Save',
                      onPressed: () {
                        if (!(_formKey.currentState?.validate() ?? false)) return;
                        final payload = _payload();
                        if (state.profile == null) {
                          context
                              .read<InvestorProfileBloc>()
                              .add(InvestorProfileCreateRequested(payload));
                        } else {
                          context
                              .read<InvestorProfileBloc>()
                              .add(InvestorProfileUpdateRequested(payload));
                        }
                      },
                    ),
                    AppSpacing.gapXl,
                    Text(
                      'Tools',
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    AppSpacing.gapSm,
                    Card(
                      child: ListTile(
                        leading: const Icon(Icons.mail_outline),
                        title: const Text('Invitations'),
                        onTap: () => Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => BlocProvider(
                              create: (_) => sl<InvitationsBloc>(),
                              child: const InvitationsPage(),
                            ),
                          ),
                        ),
                      ),
                    ),
                    Card(
                      child: ListTile(
                        leading: const Icon(Icons.calendar_month_outlined),
                        title: const Text('Meetings'),
                        onTap: () => Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => BlocProvider(
                              create: (_) => sl<MeetingsBloc>(),
                              child: const MeetingsPage(),
                            ),
                          ),
                        ),
                      ),
                    ),
                    Card(
                      child: ListTile(
                        leading: const Icon(Icons.flag_outlined),
                        title: const Text('Milestones'),
                        onTap: () => Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => BlocProvider(
                              create: (_) => sl<MilestonesBloc>(),
                              child: const MilestonesPage(),
                            ),
                          ),
                        ),
                      ),
                    ),
                    Card(
                      child: ListTile(
                        leading: const Icon(Icons.star_outline),
                        title: const Text('Feedback'),
                        onTap: () => Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => BlocProvider(
                              create: (_) => sl<FeedbackBloc>(),
                              child: const FeedbackPage(),
                            ),
                          ),
                        ),
                      ),
                    ),
                    Card(
                      child: ListTile(
                        leading: const Icon(Icons.folder_open_outlined),
                        title: const Text('Documents'),
                        onTap: () => Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => BlocProvider(
                              create: (_) => sl<DocumentsBloc>(),
                              child: const DocumentsPage(),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
        ),
      ),
    );
  }
}

