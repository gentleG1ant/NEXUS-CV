package com.airesume.gateway.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.nio.file.*;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.UUID;

@Service
public class ResumeStorageService {
    @Value("${app.resume-storage}")
    private String storageDirectory;

    public record StoredResume(String filename, String sha256) {}

    public StoredResume store(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty() || file.getSize() > 10 * 1024 * 1024)
            throw new IllegalArgumentException("Resume must be a nonempty PDF or DOCX under 10 MB");
        String original = file.getOriginalFilename();
        if (original == null) throw new IllegalArgumentException("Resume filename required");
        String lower = original.toLowerCase(java.util.Locale.ROOT);
        boolean pdf = lower.endsWith(".pdf");
        boolean docx = lower.endsWith(".docx");
        byte[] content = file.getBytes();
        boolean pdfMagic = content.length >= 5 && new String(content, 0, 5, java.nio.charset.StandardCharsets.US_ASCII).equals("%PDF-");
        boolean zipMagic = content.length >= 4 && content[0] == 'P' && content[1] == 'K';
        if ((!pdf || !pdfMagic) && (!docx || !zipMagic))
            throw new IllegalArgumentException("File type does not match a PDF or DOCX resume");
        String filename = UUID.randomUUID() + (pdf ? ".pdf" : ".docx");
        Path directory = Path.of(storageDirectory).toAbsolutePath().normalize();
        Files.createDirectories(directory);
        Files.write(directory.resolve(filename), content, StandardOpenOption.CREATE_NEW);
        try {
            return new StoredResume(filename, HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(content)));
        } catch (NoSuchAlgorithmException impossible) {
            throw new IllegalStateException(impossible);
        }
    }

    public byte[] read(String filename) throws IOException {
        if (filename == null || !filename.matches("[a-f0-9-]{36}\\.(pdf|docx)"))
            throw new IllegalArgumentException("Invalid stored resume identifier");
        return Files.readAllBytes(Path.of(storageDirectory).toAbsolutePath().normalize().resolve(filename));
    }
}
