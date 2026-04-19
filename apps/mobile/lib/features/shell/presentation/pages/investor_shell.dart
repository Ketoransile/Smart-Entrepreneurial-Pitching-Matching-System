import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/di/injection_container.dart';
import '../../../feed/presentation/bloc/feed_bloc.dart';
import '../../../feed/presentation/pages/feed_page.dart';
import '../../../saved_pitches/presentation/bloc/saved_pitches_bloc.dart';
import '../../../saved_pitches/presentation/pages/saved_pitches_page.dart';
import '../../../match_queue/presentation/bloc/match_queue_bloc.dart';
import '../../../match_queue/presentation/pages/match_queue_page.dart';
import '../../../messaging/presentation/bloc/messaging_bloc.dart';
import '../../../messaging/presentation/pages/message_center_page.dart';
import '../../../investor_profile/presentation/bloc/investor_profile_bloc.dart';
import '../../../investor_profile/presentation/pages/investor_profile_page.dart';

class InvestorShell extends StatefulWidget {
  const InvestorShell({super.key});

  @override
  State<InvestorShell> createState() => _InvestorShellState();
}

class _InvestorShellState extends State<InvestorShell> {
  int _index = 0;

  @override
  Widget build(BuildContext context) {
    final pages = <Widget>[
      BlocProvider<FeedBloc>(
        create: (_) => sl<FeedBloc>(),
        child: const FeedPage(),
      ),
      BlocProvider<SavedPitchesBloc>(
        create: (_) => sl<SavedPitchesBloc>(),
        child: const SavedPitchesPage(),
      ),
      BlocProvider<MatchQueueBloc>(
        create: (_) => sl<MatchQueueBloc>(),
        child: const MatchQueuePage(),
      ),
      BlocProvider<MessagingBloc>(
        create: (_) => sl<MessagingBloc>(),
        child: const MessageCenterPage(),
      ),
      BlocProvider<InvestorProfileBloc>(
        create: (_) => sl<InvestorProfileBloc>(),
        child: const InvestorProfilePage(),
      ),
    ];

    return Scaffold(
      body: pages[_index],
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (i) => setState(() => _index = i),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.view_list_outlined), label: 'Feed'),
          NavigationDestination(icon: Icon(Icons.bookmark_outline), label: 'Saved'),
          NavigationDestination(icon: Icon(Icons.handshake_outlined), label: 'Matches'),
          NavigationDestination(icon: Icon(Icons.chat_bubble_outline), label: 'Messages'),
          NavigationDestination(icon: Icon(Icons.person_outline), label: 'Profile'),
        ],
      ),
    );
  }
}

class _PlaceholderTab extends StatelessWidget {
  final String title;
  const _PlaceholderTab({required this.title});

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Center(
        child: Text(
          title,
          style: Theme.of(context).textTheme.headlineSmall,
          textAlign: TextAlign.center,
        ),
      ),
    );
  }
}

