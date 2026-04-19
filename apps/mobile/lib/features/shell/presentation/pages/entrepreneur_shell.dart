import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../entrepreneur_profile/presentation/bloc/entrepreneur_profile_bloc.dart';
import '../../../entrepreneur_profile/presentation/pages/entrepreneur_profile_page.dart';
import '../../../../core/di/injection_container.dart';
import '../../../submissions/presentation/bloc/submissions_bloc.dart';
import '../../../submissions/presentation/pages/my_submissions_page.dart';
import 'entrepreneur_home_page.dart';
import '../../../../core/di/injection_container.dart';
import '../../../messaging/presentation/bloc/messaging_bloc.dart';
import '../../../messaging/presentation/pages/message_center_page.dart';

class EntrepreneurShell extends StatefulWidget {
  const EntrepreneurShell({super.key});

  @override
  State<EntrepreneurShell> createState() => _EntrepreneurShellState();
}

class _EntrepreneurShellState extends State<EntrepreneurShell> {
  int _index = 0;

  @override
  Widget build(BuildContext context) {
    final pages = <Widget>[
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

    return Scaffold(
      body: pages[_index],
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (i) => setState(() => _index = i),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.home_outlined), label: 'Home'),
          NavigationDestination(
            icon: Icon(Icons.description_outlined),
            label: 'Pitches',
          ),
          NavigationDestination(
            icon: Icon(Icons.chat_bubble_outline),
            label: 'Messages',
          ),
          NavigationDestination(
            icon: Icon(Icons.person_outline),
            label: 'Profile',
          ),
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

