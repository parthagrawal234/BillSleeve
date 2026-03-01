import 'dart:io';
import 'package:flutter/material.dart';
import 'package:camera/camera.dart';
import '../services/encryption_service.dart';
import '../services/api_service.dart';

class CameraScreen extends StatefulWidget {
  final List<CameraDescription> cameras;
  const CameraScreen({Key? key, required this.cameras}) : super(key: key);

  @override
  _CameraScreenState createState() => _CameraScreenState();
}

class _CameraScreenState extends State<CameraScreen> {
  late CameraController _controller;
  bool _isProcessing = false;

  @override
  void initState() {
    super.initState();
    _controller = CameraController(
      widget.cameras.first, 
      ResolutionPreset.high,
      enableAudio: false,
    );
    _controller.initialize().then((_) {
      if (!mounted) return;
      setState(() {});
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _takePictureAndUpload() async {
    if (!_controller.value.isInitialized || _isProcessing) return;

    setState(() => _isProcessing = true);
    
    try {
      // 1. Capture Image
      final XFile file = await _controller.takePicture();
      final bytes = await File(file.path).readAsBytes();

      // 2. Encrypt locally (Zero-knowledge)
      final encryptedMap = EncryptionService.encryptBytes(bytes);

      // 3. Upload to backend
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Encrypting & Uploading...')));
      
      final response = await ApiService.uploadEncryptedBill(
        cipherTextBase64: encryptedMap['cipherText'],
        ivBase64: encryptedMap['iv'],
      );

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Success! Bill ID: ${response["bill_id"]}')),
      );
      
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    } finally {
      setState(() => _isProcessing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (!_controller.value.isInitialized) {
      return Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        title: Text('Scan Receipt', style: TextStyle(color: Colors.white)),
        backgroundColor: Colors.black,
      ),
      body: Stack(
        children: [
          Positioned.fill(child: CameraPreview(_controller)),
          if (_isProcessing)
            Container(
              color: Colors.black54,
              child: Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    CircularProgressIndicator(color: Colors.limeAccent),
                    SizedBox(height: 16),
                    Text("Securing & parsing...", style: TextStyle(color: Colors.white))
                  ],
                ),
              ),
            ),
          Align(
            alignment: Alignment.bottomCenter,
            child: Padding(
              padding: const EdgeInsets.only(bottom: 40.0),
              child: FloatingActionButton(
                backgroundColor: Colors.limeAccent,
                onPressed: _takePictureAndUpload,
                child: Icon(Icons.camera_alt, color: Colors.black, size: 30),
              ),
            ),
          )
        ],
      ),
    );
  }
}
