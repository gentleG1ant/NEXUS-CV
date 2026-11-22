package com.airesume.gateway.controller;

import com.airesume.gateway.model.Candidate;
import com.airesume.gateway.model.Job;
import com.airesume.gateway.repository.CandidateRepository;
import com.airesume.gateway.repository.JobRepository;
import com.airesume.gateway.repository.ReviewEventRepository;
import com.airesume.gateway.service.ResumeStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequiredArgsConstructor
public class JobManagementController {
    private final JobRepository jobs;
    private final CandidateRepository candidates;
    private final ReviewEventRepository events;
    private final ResumeStorageService storage;

    public record JobRequest(String title, String description, String requiredSkills, String preferredSkills) {}
    public record JobView(Long id, String title, String description, String requiredSkills,
                          String preferredSkills, String status) {}

    @PostMapping("/api/jobs")
    public ResponseEntity<?> create(@RequestBody JobRequest request) {
        if (request == null || blank(request.title()) || blank(request.description()) || blank(request.requiredSkills())
                || request.title().length() > 255 || request.description().length() > 20000
                || request.requiredSkills().length() > 4000
                || (request.preferredSkills() != null && request.preferredSkills().length() > 4000)) {
            return ResponseEntity.badRequest().body("Title, description and required skills are needed within length limits");
        }
        Job job = jobs.save(Job.builder().title(request.title().trim())
                .description(request.description().trim()).requiredSkills(request.requiredSkills().trim())
                .preferredSkills(request.preferredSkills() == null ? "" : request.preferredSkills().trim())
                .status("DRAFT").build());
        return ResponseEntity.status(201).body(view(job));
    }

    @PatchMapping("/api/jobs/{id}/publish")
    public ResponseEntity<?> publish(@PathVariable Long id) {
        return jobs.findById(id).map(job -> {
            if ("CLOSED".equals(job.getStatus())) {
                return ResponseEntity.badRequest().body("This recruitment has been permanently closed and cannot be republished. Only paused positions can be published.");
            }
            job.setStatus("PUBLISHED");
            return ResponseEntity.ok(view(jobs.save(job)));
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PatchMapping("/api/jobs/{id}/pause")
    public ResponseEntity<?> pause(@PathVariable Long id) {
        return jobs.findById(id).map(job -> {
            if ("CLOSED".equals(job.getStatus())) {
                return ResponseEntity.badRequest().body("Closed recruitment positions cannot be paused.");
            }
            job.setStatus("PAUSED");
            return ResponseEntity.ok(view(jobs.save(job)));
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PatchMapping({"/api/jobs/{id}/close", "/api/jobs/{id}/unpublish"})
    @Transactional
    public ResponseEntity<?> close(@PathVariable Long id) {
        return deleteRole(id);
    }

    @DeleteMapping("/api/jobs/{id}")
    @Transactional
    public ResponseEntity<?> delete(@PathVariable Long id) {
        return deleteRole(id);
    }

    private ResponseEntity<?> deleteRole(Long id) {
        return jobs.findById(id).map(job -> {
            // Permanently remove candidate dataset for this closed recruitment
            List<Candidate> candidateList = candidates.findByJobId(id);
            for (Candidate c : candidateList) {
                if (c.getResumeFilePath() != null) {
                    storage.delete(c.getResumeFilePath());
                }
                events.deleteByCandidateId(c.getId());
            }
            candidates.deleteAll(candidateList);
            candidates.flush();

            // Permanently clear the job from database
            jobs.delete(job);
            jobs.flush();
            job.setStatus("CLOSED");
            return ResponseEntity.ok(view(job));
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/api/public/jobs")
    public List<JobView> published() {
        return jobs.findByStatusOrderByCreatedAtDesc("PUBLISHED").stream().map(this::view).toList();
    }

    private JobView view(Job j) {
        return new JobView(j.getId(), j.getTitle(), j.getDescription(), j.getRequiredSkills(),
                j.getPreferredSkills(), j.getStatus());
    }
    private boolean blank(String value) { return value == null || value.isBlank(); }
}
