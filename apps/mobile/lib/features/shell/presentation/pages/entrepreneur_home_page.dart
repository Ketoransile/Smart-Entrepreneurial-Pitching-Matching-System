import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/di/injection_container.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../documents/presentation/bloc/documents_bloc.dart';
import '../../../documents/presentation/pages/documents_page.dart';
import '../../../invitations/presentation/bloc/invitations_bloc.dart';
import '../../../invitations/presentation/pages/invitations_page.dart';
import '../../../meetings/presentation/bloc/meetings_bloc.dart';
import '../../../meetings/presentation/pages/meetings_page.dart';
import '../../../milestones/presentation/bloc/milestones_bloc.dart';
import '../../../milestones/presentation/pages/milestones_page.dart';
import '../../../feedback/presentation/bloc/feedback_bloc.dart';
import '../../../feedback/presentation/pages/feedback_page.dart';

class EntrepreneurHomePage extends StatelessWidget {
  const EntrepreneurHomePage({super.key});

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Padding(
        padding: AppSpacing.screenPadding,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              'Entrepreneur',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            AppSpacing.gapMd,
            Card(
              child: ListTile(
                leading: const Icon(Icons.folder_open_outlined),
                title: const Text('Documents'),
                subtitle: const Text('Upload pitch deck and supporting files'),
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => BlocProvider(
                        create: (_) => sl<DocumentsBloc>(),
                        child: const DocumentsPage(),
                      ),
                    ),
                  );
                },
              ),
            ),
            AppSpacing.gapMd,
            Card(
              child: ListTile(
                leading: const Icon(Icons.mail_outline),
                title: const Text('Invitations'),
                subtitle: const Text('View and respond to invitations'),
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => BlocProvider(
                        create: (_) => sl<InvitationsBloc>(),
                        child: const InvitationsPage(),
                      ),
                    ),
                  );
                },
              ),
            ),
            AppSpacing.gapMd,
            Card(
              child: ListTile(
                leading: const Icon(Icons.calendar_month_outlined),
                title: const Text('Meetings'),
                subtitle: const Text('Schedule and manage meetings'),
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => BlocProvider(
                        create: (_) => sl<MeetingsBloc>(),
                        child: const MeetingsPage(),
                      ),
                    ),
                  );
                },
              ),
            ),
            AppSpacing.gapMd,
            Card(
              child: ListTile(
                leading: const Icon(Icons.flag_outlined),
                title: const Text('Milestones'),
                subtitle: const Text('Track and verify milestones'),
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => BlocProvider(
                        create: (_) => sl<MilestonesBloc>(),
                        child: const MilestonesPage(),
                      ),
                    ),
                  );
                },
              ),
            ),
            AppSpacing.gapMd,
            Card(
              child: ListTile(
                leading: const Icon(Icons.star_outline),
                title: const Text('Feedback'),
                subtitle: const Text('View and submit feedback'),
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => BlocProvider(
                        create: (_) => sl<FeedbackBloc>(),
                        child: const FeedbackPage(),
                      ),
                    ),
                  );
                },
              ),
            ),
            const Spacer(),
            const Text(
              'Next: matching + invitations + messaging will appear here.',
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}

