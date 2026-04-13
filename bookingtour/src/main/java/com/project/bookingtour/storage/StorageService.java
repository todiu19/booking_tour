package com.project.bookingtour.storage;

import org.springframework.web.multipart.MultipartFile;

public interface StorageService {
    String storeTourImage(MultipartFile file);
}
