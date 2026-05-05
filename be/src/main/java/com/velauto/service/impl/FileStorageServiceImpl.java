package com.velauto.service.impl;

import com.velauto.service.FileStorageService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Slf4j
@Service
public class FileStorageServiceImpl implements FileStorageService {

  private static final String MOCK_STORAGE_BASE_URL = "https://dummy-storage.velauto.com/uploads";

  @Override
  public String uploadFile(byte[] fileBytes, String originalFileName) {
    String fileId = UUID.randomUUID().toString();
    String mockUrl = MOCK_STORAGE_BASE_URL + "/" + fileId + "-" + sanitizeFileName(originalFileName);
    System.out.println("✅ MOCK File Uploaded: " + mockUrl);
    return mockUrl;
  }

  @Override
  public void deleteFile(String fileUrl) {
    System.out.println("✅ MOCK File Deleted: " + fileUrl);
  }

  private String sanitizeFileName(String fileName) {
    if (fileName == null) {
      return "file";
    }
    return fileName.replaceAll("[^a-zA-Z0-9._-]", "_");
  }
}

