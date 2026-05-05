package com.velauto.service;

public interface FileStorageService {

  String uploadFile(byte[] fileBytes, String originalFileName);

  void deleteFile(String fileUrl);
}

