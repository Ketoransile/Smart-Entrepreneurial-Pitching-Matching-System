import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/widgets/app_bottom_nav.dart';
import '../../../entrepreneur_profile/presentation/bloc/entrepreneur_profile_bloc.dart';
import '../../../entrepreneur_profile/presentation/pages/entrepreneur_profile_page.dart';
import '../../../../core/di/injection_container.dart';
import '../../../submissions/presentation/bloc/submissions_bloc.dart';
import '../../../submissions/presentation/pages/my_submissions_page.dart';
import 'entrepreneur_home_page.dart';
import '../../../messaging/presentation/bloc/messaging_bloc.dart';
import '../../../messaging/presentation/pages/message_center_page.dart';

class EntrepreneurShell extends StatefulWidget {
  const EntrepreneurShell({super.key});

  @override
  State<EntrepreneurShell> createState() => _EntrepreneurShellState();
}

class _EntrepreneurShellState extends State<EntrepreneurShell> {
  int _index = 0;
  late final List<Widget> _pages;

  @override
  void initState() {
    super.initState();
    _pages = <Widget>[
      const EntrepreneurHomePage(),
      BlocProvider<SubmissionsBloc>(
        create: (_) => sl<SubmissionsBloc>(),
        child: const MySubmissionsPage(),
      ),
      BlocProvider<MessagingBloc>(
        create: (_) => sl<MessagingBloc>(),
        child: const MessageCenterPage(),
      ),
      BlocProvider<EntrepreneurProfileBloc>(
        create: (_) => sl<EntrepreneurProfileBloc>(),
        child: const EntrepreneurProfilePage(),
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
            icon: Icons.home_outlined,
            selectedIcon: Icons.home,
            label: 'Home',
          ),
          AppBottomNavDestination(
            icon: Icons.description_outlined,
            selectedIcon: Icons.description,
            label: 'Pitches',
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
