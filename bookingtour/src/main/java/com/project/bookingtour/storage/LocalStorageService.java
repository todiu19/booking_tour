package com.project.bookingtour.storage;

import com.project.bookingtour.common.exception.AppException;
import com.project.bookingtour.common.exception.ErrorCode;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Set;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class LocalStorageService implements StorageService {

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("jpg", "jpeg", "png", "webp");
    private static final String STATIC_TOUR_IMAGES_DIR = "src/main/resources/static/images/tours";

    private final Path tourImagesDir =
            Paths.get(STATIC_TOUR_IMAGES_DIR).toAbsolutePath().normalize();

    @Override
    public String storeTourImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Image file is empty");
        }
        String originalName = file.getOriginalFilename();
        String ext = extensionOf(originalName);
        if (!ALLOWED_EXTENSIONS.contains(ext)) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Only jpg, jpeg, png, webp are allowed");
        }
        try {
            Files.createDirectories(tourImagesDir);
            String filename = UUID.randomUUID() + "." + ext;
            Path target = tourImagesDir.resolve(filename);
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
            return "/images/tours/" + filename;
        } catch (IOException ex) {
            throw new AppException(ErrorCode.INTERNAL_ERROR, "Cannot store image file");
        }
    }

    private static String extensionOf(String filename) {
        if (filename == null) {
            return "";
        }
        int idx = filename.lastIndexOf('.');
        if (idx < 0 || idx == filename.length() - 1) {
            return "";
        }
        return filename.substring(idx + 1).toLowerCase();
    }
}
