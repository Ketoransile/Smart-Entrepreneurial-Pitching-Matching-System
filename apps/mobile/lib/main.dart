import 'package:firebase_core/firebase_core.dart';
import 'firebase_options.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'app.dart';
import 'core/di/injection_container.dart';
import 'package:device_preview/device_preview.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize Firebase
  // On some desktop targets (or when platform configuration is missing)
  // initializeApp may throw. Catch errors so the app can still run for
  // local development on unsupported targets.
  try {
    await Firebase.initializeApp(
      options: DefaultFirebaseOptions.currentPlatform,
    );
  } catch (e, st) {
    debugPrint('Firebase.initializeApp() failed: $e');
    debugPrintStack(stackTrace: st);
  }

  // Set preferred orientations
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);

  // Set system UI overlay style
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.dark,
      systemNavigationBarColor: Colors.white,
      systemNavigationBarIconBrightness: Brightness.dark,
    ),
  );

  // Initialize dependencies only if Firebase initialized successfully.
  // Many app services depend on Firebase (auth, etc). If Firebase failed
  // to initialize (e.g., running on desktop without platform config),
  // run a minimal stub app instead to avoid startup crashes.
  if (Firebase.apps.isNotEmpty) {
    await initDependencies();

    runApp(
      DevicePreview(
        enabled: false, // Set to false to disable device preview
        builder: (context) => const SepmsApp(),
      ),
    );
  } else {
    runApp(
      DevicePreview(
        enabled: false,
        builder: (context) => const _FirebaseMissingStubApp(),
      ),
    );
  }
}

class _FirebaseMissingStubApp extends StatelessWidget {
  const _FirebaseMissingStubApp();

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'SEPMS (Firebase not configured)',
      debugShowCheckedModeBanner: false,
      home: Scaffold(
        appBar: AppBar(title: const Text('SEPMS - Missing Firebase')),
        body: const Padding(
          padding: EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                'Firebase is not configured for this platform.\n\n'
                'To run the full app, configure Firebase for desktop/web, or run on a '
                'mobile device with Firebase configured.',
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
