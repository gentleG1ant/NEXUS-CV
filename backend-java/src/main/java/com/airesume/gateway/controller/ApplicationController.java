package com.airesume.gateway.controller;

import com.airesume.gateway.model.Candidate;
import com.airesume.gateway.repository.CandidateRepository;
import com.airesume.gateway.repository.JobRepository;
import com.airesume.gateway.service.ResumeForwardingService;
import com.airesume.gateway.service.ResumeStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.nio.file.NoSuchFileException;
import java.util.List;

@RestController
@RequiredArgsConstructor
public class ApplicationController {
    private final JobRepository jobs;
    private final CandidateRepository candidates;
    private final ResumeForwardingService scoring;
    private final ResumeStorageService storage;

    public record ApplicationReceipt(Long applicationId, String status) {}

    @PostMapping(path = "/api/public/jobs/{jobId}/apply", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> apply(@PathVariable Long jobId,
            @RequestParam String name, @RequestParam String email,
            @RequestPart("resume") MultipartFile resume) throws IOException {
        var job = jobs.findById(jobId);
        if (job.isEmpty() || !"PUBLISHED".equals(job.get().getStatus()))
            return ResponseEntity.notFound().build();
        if (name == null || name.isBlank() || name.length() > 255 || email == null
                || email.length() > 255 || !email.matches("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$"))
            return ResponseEntity.badRequest().body("Provide a name and valid email address");
            
        if (candidates.existsByEmailAndJobId(email.trim(), jobId)) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("You have already applied for this job");
        }
        
        ResumeStorageService.StoredResume stored;
        try {
            stored = storage.store(resume);
        } catch (IllegalArgumentException invalid) {
            return ResponseEntity.badRequest().body(invalid.getMessage());
        }
        Candidate candidate = candidates.save(Candidate.builder()
                .job(job.get()).name(name.trim()).email(email.trim()).source("CAREERS_PAGE")
                .resumeFilePath(stored.filename()).fileHash(stored.sha256()).stage("NEW")
                .aiFeedback("Screening pending or unavailable; review the original resume.").build());

        // Application intake succeeds even if extraction or scoring cannot run.
        try {
            var result = scoring.forwardToAiService(job.get().getTitle(), job.get().getDescription(),
                    job.get().getRequiredSkills(), job.get().getPreferredSkills(), 0, "", List.of(resume));
            if (result != null && result.getRankings() != null && !result.getRankings().isEmpty()) {
                var match = result.getRankings().get(0);
                candidate.setAiScore(match.getFinal_score());
                candidate.setAiFeedback(match.getRecruiter_explanation());
                candidates.save(candidate);
            }
        } catch (Exception scoringFailure) {
            // Never lose an application because the analysis worker is down.
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(new ApplicationReceipt(candidate.getId(), "RECEIVED"));
    }

    @GetMapping("/api/candidates/{candidateId}/resume")
    public ResponseEntity<byte[]> download(@PathVariable Long candidateId) throws IOException {
        var candidate = candidates.findById(candidateId);
        if (candidate.isEmpty() || candidate.get().getResumeFilePath() == null)
            return ResponseEntity.notFound().build();
        try {
            byte[] bytes = storage.read(candidate.get().getResumeFilePath());
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=resume-" + candidateId + "." +
                            (candidate.get().getResumeFilePath().endsWith(".pdf") ? "pdf" : "docx"))
                    .body(bytes);
        } catch (NoSuchFileException missing) {
            return ResponseEntity.notFound().build();
        }
    }
}
