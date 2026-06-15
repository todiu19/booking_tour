package com.project.bookingtour.storage;

import com.project.bookingtour.common.exception.AppException;
import com.project.bookingtour.common.exception.ErrorCode;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class LocalStorageService implements StorageService {

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("jpg", "jpeg", "png", "webp");
    private static final Map<String, String> ALLOWED_GROUPS =
            Map.of(
                    "tours", "tours",
                    "hotels", "hotels",
                    "destinations", "destinations");
    private static final String STATIC_IMAGES_DIR = "src/main/resources/static/images";

    private final Path imagesDir = Paths.get(STATIC_IMAGES_DIR).toAbsolutePath().normalize();

    @Override
    public String storeTourImage(MultipartFile file) {
        return storeImage("tours", file);
    }

    @Override
    public String storeImage(String group, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Image file is empty");
        }
        String normalizedGroup = normalizeGroup(group);
        String originalName = file.getOriginalFilename();
        String ext = extensionOf(originalName);
        if (!ALLOWED_EXTENSIONS.contains(ext)) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Only jpg, jpeg, png, webp are allowed");
        }
        try {
            Path targetDir = imagesDir.resolve(normalizedGroup).normalize();
            Files.createDirectories(targetDir);
            String filename = UUID.randomUUID() + "." + ext;
            Path target = targetDir.resolve(filename);
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
            return "/images/" + normalizedGroup + "/" + filename;
        } catch (IOException ex) {
            throw new AppException(ErrorCode.INTERNAL_ERROR, "Cannot store image file");
        }
    }

    private static String normalizeGroup(String group) {
        String key = group == null ? "" : group.trim().toLowerCase();
        String normalized = ALLOWED_GROUPS.get(key);
        if (normalized == null) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Invalid image group");
        }
        return normalized;
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
