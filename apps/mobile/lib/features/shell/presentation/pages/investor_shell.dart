import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/di/injection_container.dart';
import '../../../../core/widgets/app_bottom_nav.dart';
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
  late final List<Widget> _pages;

  @override
  void initState() {
    super.initState();
    _pages = <Widget>[
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
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      extendBody: true,
      body: IndexedStack(index: _index, children: _pages),
      bottomNavigationBar: AppBottomNav(
        selectedIndex: _index,
        onDestinationSelected: (i) => setState(() => _index = i),
        destinations: const <AppBottomNavDestination>[
          AppBottomNavDestination(
            icon: Icons.view_list_outlined,
            selectedIcon: Icons.view_list,
            label: 'Feed',
          ),
          AppBottomNavDestination(
            icon: Icons.bookmark_outline,
            selectedIcon: Icons.bookmark,
            label: 'Saved',
          ),
          AppBottomNavDestination(
            icon: Icons.handshake_outlined,
            selectedIcon: Icons.handshake,
            label: 'Matches',
          ),
          AppBottomNavDestination(
            icon: Icons.chat_bubble_outline,
            selectedIcon: Icons.chat_bubble,
            label: 'Messages',
          ),
          AppBottomNavDestination(
            icon: Icons.person_outline,
            selectedIcon: Icons.person,
            label: 'Profile',
          ),
        ],
      ),
    );
  }
}
