package com.project.bookingtour.storage;

import org.springframework.web.multipart.MultipartFile;

public interface StorageService {
    String storeImage(String group, MultipartFile file);

    String storeTourImage(MultipartFile file);
}
