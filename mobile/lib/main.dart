import 'package:flutter/material.dart';
import 'package:camera/camera.dart';
import 'screens/camera_screen.dart';

List<CameraDescription> cameras = [];

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  try {
    cameras = await availableCameras();
  } catch (e) {
    // Handling emulators with no camera gracefully
    print("Camera error: $e");
  }
  runApp(const BillSleeveApp());
}

class BillSleeveApp extends StatelessWidget {
  const BillSleeveApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'BillSleeve',
      theme: ThemeData(
        brightness: Brightness.dark,
        primaryColor: Colors.limeAccent,
        scaffoldBackgroundColor: Colors.black,
        colorScheme: ColorScheme.dark(
          primary: Colors.limeAccent,
          secondary: Colors.indigoAccent,
        ),
      ),
      home: CameraScreen(cameras: cameras),
    );
  }
}
