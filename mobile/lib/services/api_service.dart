import 'dart:convert';
import 'package:http/http.dart' as http;
import 'dart:typed_data';

class ApiService {
  // Use 10.0.2.2 for Android emulator testing against localhost Python backend
  static const String baseUrl = 'http://10.0.2.2:8000';
  
  // Dummy user ID for prototype
  static const String userId = 'test_user_123';

  /// Uploads an encrypted image to the backend for OCR and parsing
  static Future<Map<String, dynamic>> uploadEncryptedBill({
    required String cipherTextBase64,
    required String ivBase64,
  }) async {
    final response = await http.post(
      Uri.parse('$baseUrl/bills/upload'),
      headers: {
        'Content-Type': 'application/json',
        'X-User-ID': userId,
      },
      body: jsonEncode({
        'encrypted_data': cipherTextBase64,
        'iv': ivBase64,
      }),
    );

    if (response.statusCode == 200 || response.statusCode == 201) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to upload bill: ${response.statusCode} - ${response.body}');
    }
  }

  /// Fetches all warranties
  static Future<List<dynamic>> getWarranties() async {
    final response = await http.get(
      Uri.parse('$baseUrl/warranties/'),
      headers: {
        'X-User-ID': userId,
      }
    );

    if (response.statusCode == 200) {
      final json = jsonDecode(response.body);
      return json['warranties'] ?? [];
    } else {
      throw Exception('Failed to load warranties');
    }
  }
}
