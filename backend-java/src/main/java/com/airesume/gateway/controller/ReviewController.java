package com.airesume.gateway.controller;

import com.airesume.gateway.model.Candidate;
import com.airesume.gateway.model.ReviewEvent;
import com.airesume.gateway.repository.CandidateRepository;
import com.airesume.gateway.repository.JobRepository;
import com.airesume.gateway.repository.ReviewEventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ReviewController {
    private static final Set<String> STAGES = Set.of("NEW", "REVIEW", "INTERVIEW", "OFFER", "HIRED", "REJECTED");
    private final JobRepository jobs;
    private final CandidateRepository candidates;
    private final ReviewEventRepository events;

    public record JobView(Long id, String title, String description, String requiredSkills,
                          String preferredSkills, String status, String createdAt) {}
    public record CandidateView(Long id, Long jobId, String name, String email, String source,
                                boolean resumeAvailable, Double matchScore,
                                String matchExplanation, String stage, String decisionReason) {}
    public record StageRequest(String stage, String reason) {}
    public record EventView(String actor, String fromStage, String toStage, String reason, String occurredAt) {}

    @GetMapping("/jobs")
    public List<JobView> listJobs() {
        return jobs.findAll().stream()
                .filter(j -> !"CLOSED".equals(j.getStatus()) && !"UNPUBLISHED".equals(j.getStatus()))
                .map(j -> new JobView(j.getId(), j.getTitle(), j.getDescription(),
                j.getRequiredSkills(), j.getPreferredSkills(), j.getStatus(),
                j.getCreatedAt() == null ? null : j.getCreatedAt().toString())).toList();
    }

    @GetMapping("/jobs/{id}/candidates")
    public ResponseEntity<List<CandidateView>> listCandidates(@PathVariable Long id) {
        if (!jobs.existsById(id)) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(candidates.findByJobIdOrderByAiScoreDesc(id).stream().map(this::view).toList());
    }

    @GetMapping("/candidates/{id}/events")
    public ResponseEntity<List<EventView>> history(@PathVariable Long id) {
        if (!candidates.existsById(id)) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(events.findByCandidateIdOrderByOccurredAtDesc(id).stream()
                .map(e -> new EventView(e.getActor(), e.getFromStage(), e.getToStage(),
                        e.getReason(), e.getOccurredAt().toString())).toList());
    }

    @PatchMapping("/candidates/{id}/stage")
    @Transactional
    public ResponseEntity<?> updateStage(@PathVariable Long id, @RequestBody StageRequest request,
                                         Authentication authentication) {
        if (request == null || request.stage() == null || !STAGES.contains(request.stage()))
            return ResponseEntity.badRequest().body("Invalid stage");
        if (request.reason() == null || request.reason().isBlank() || request.reason().length() > 2000)
            return ResponseEntity.badRequest().body("A reason of at most 2000 characters is required");
        var found = candidates.findById(id);
        if (found.isEmpty()) return ResponseEntity.notFound().build();
        Candidate candidate = found.get();
        if (candidate.getStage().equals(request.stage())) return ResponseEntity.badRequest().body("Stage is unchanged");
        ReviewEvent event = new ReviewEvent();
        event.setCandidateId(id);
        event.setActor(authentication.getName());
        event.setFromStage(candidate.getStage());
        event.setToStage(request.stage());
        event.setReason(request.reason().trim());
        candidate.setStage(request.stage());
        candidate.setDecisionReason(request.reason().trim());
        candidates.save(candidate);
        events.save(event);
        return ResponseEntity.ok(view(candidate));
    }

    private CandidateView view(Candidate c) {
        return new CandidateView(c.getId(), c.getJob().getId(), c.getName(), c.getEmail(), c.getSource(),
                c.getResumeFilePath() != null, c.getAiScore(),
                c.getAiFeedback(), c.getStage(), c.getDecisionReason());
    }
}
