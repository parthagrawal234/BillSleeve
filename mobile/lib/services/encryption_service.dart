import 'dart:convert';
import 'dart:typed_data';
import 'package:encrypt/encrypt.dart' as encrypt;

class EncryptionService {
  // In a real app, this should be generated securely or tied to biometrics/keychain.
  // For this prototype, we'll hardcode a master key derived string.
  static final _keyStr = 'BillSleeveSecureKey32BytesLong!!';

  static final encrypt.Key _key = encrypt.Key.fromUtf8(_keyStr);

  /// Encrypts raw bytes (like an image) using AES-256-GCM
  static Map<String, dynamic> encryptBytes(Uint8List data) {
    final iv = encrypt.IV.fromLength(12); // GCM typical nonce size
    final encrypter =
        encrypt.Encrypter(encrypt.AES(_key, mode: encrypt.AESMode.gcm));

    final encrypted = encrypter.encryptBytes(data, iv: iv);

    return {
      'cipherText': base64Encode(encrypted.bytes),
      'iv': base64Encode(iv.bytes),
      // encrypt library appends the MAC tag to the end of bytes in GCM mode automatically
    };
  }

  /// Encrypts text (like parsed metadata)
  static Map<String, dynamic> encryptText(String text) {
    return encryptBytes(utf8.encode(text));
  }

  /// Decrypts a base64 encoded payload
  static Uint8List decryptBytes(String cipherTextBase64, String ivBase64) {
    final iv = encrypt.IV.fromBase64(ivBase64);
    final encrypter =
        encrypt.Encrypter(encrypt.AES(_key, mode: encrypt.AESMode.gcm));

    // Decrypt directly from the encrypted object containing bytes
    final encryptedData = encrypt.Encrypted.fromBase64(cipherTextBase64);
    return Uint8List.fromList(encrypter.decryptBytes(encryptedData, iv: iv));
  }
}
