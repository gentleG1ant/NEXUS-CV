package com.airesume.gateway.controller;

import com.airesume.gateway.model.Job;
import com.airesume.gateway.repository.JobRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequiredArgsConstructor
public class JobManagementController {
    private final JobRepository jobs;

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
    public ResponseEntity<JobView> publish(@PathVariable Long id) {
        return jobs.findById(id).map(job -> {
            job.setStatus("PUBLISHED");
            return ResponseEntity.ok(view(jobs.save(job)));
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
