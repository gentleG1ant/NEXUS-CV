package com.airesume.gateway.controller;

import com.airesume.gateway.dto.AIScoringResponse;
import com.airesume.gateway.model.Candidate;
import com.airesume.gateway.model.Job;
import com.airesume.gateway.repository.CandidateRepository;
import com.airesume.gateway.repository.JobRepository;
import com.airesume.gateway.service.ResumeForwardingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/jobs")
@RequiredArgsConstructor
public class JobProcessingController {

    private final JobRepository jobRepository;
    private final CandidateRepository candidateRepository;
    private final ResumeForwardingService resumeForwardingService;
    private final com.airesume.gateway.service.ResumeStorageService storage;

    @PostMapping("/process-resumes")
    public ResponseEntity<AIScoringResponse> processResumes(
            @RequestParam("title") String jobTitle,
            @RequestParam("description") String jobDescription,
            @RequestParam("requiredSkills") String requiredSkills,
            @RequestParam(value = "preferredSkills", required = false) String preferredSkills,
            @RequestParam(value = "minExperience", required = false) Integer minExperience,
            @RequestParam(value = "educationLevel", required = false) String educationLevel,
            @RequestParam("files") List<MultipartFile> files) {

        try {
            // 1. Save Job to Java DB
            // Score first, so a failed scoring request does not leave an empty job.
            AIScoringResponse aiResponse = resumeForwardingService.forwardToAiService(
                    jobTitle, jobDescription, requiredSkills, preferredSkills, minExperience, educationLevel, files
            );

            if (aiResponse == null || aiResponse.getRankings() == null) {
                return ResponseEntity.internalServerError().build();
            }
            Job job = jobRepository.save(Job.builder().title(jobTitle).description(jobDescription)
                    .requiredSkills(requiredSkills).preferredSkills(preferredSkills).status("DRAFT").build());
            aiResponse.setJobId(job.getId());
            for (var rank : aiResponse.getRankings()) {
                java.util.Map<String, Object> breakdown = new java.util.LinkedHashMap<>();
                breakdown.put("explanation", rank.getRecruiter_explanation());
                breakdown.put("strengths", rank.getStrengths() != null ? rank.getStrengths() : List.of());
                breakdown.put("skill_gaps", rank.getSkill_gaps() != null ? rank.getSkill_gaps() : List.of());
                breakdown.put("top_matching_terms", rank.getTop_matching_terms() != null ? rank.getTop_matching_terms() : List.of());
                breakdown.put("skills_required_score", rank.getSkills_required_score());
                breakdown.put("skills_preferred_score", rank.getSkills_preferred_score());
                breakdown.put("experience_score", rank.getExperience_score());
                breakdown.put("education_score", rank.getEducation_score());
                breakdown.put("global_context_score", rank.getGlobal_context_score());

                String feedbackStr;
                try {
                    feedbackStr = new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(breakdown);
                } catch (Exception jsonEx) {
                    feedbackStr = rank.getRecruiter_explanation();
                }

                Candidate candidate = candidateRepository.save(Candidate.builder()
                        .name(rank.getFilename())
                        .job(job)
                        .aiScore(rank.getFinal_score())
                        .aiFeedback(feedbackStr)
                        .stage("NEW")
                        .build());
                rank.setCandidateId(candidate.getId());
            }

            return ResponseEntity.ok(aiResponse);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/{jobId}/screen-resumes")
    public ResponseEntity<?> screenResumesForExistingJob(
            @PathVariable Long jobId,
            @RequestParam("files") List<MultipartFile> files) {

        var jobOpt = jobRepository.findById(jobId);
        if (jobOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Job job = jobOpt.get();
        if ("CLOSED".equals(job.getStatus()) || "UNPUBLISHED".equals(job.getStatus())) {
            return ResponseEntity.badRequest().body("Recruitment for this role is closed.");
        }
        if (files == null || files.isEmpty()) {
            return ResponseEntity.badRequest().body("Please upload at least one resume file.");
        }

        try {
            AIScoringResponse aiResponse = resumeForwardingService.forwardToAiService(
                    job.getTitle(), job.getDescription(), job.getRequiredSkills(),
                    job.getPreferredSkills(), 0, "", files
            );

            if (aiResponse == null || aiResponse.getRankings() == null) {
                return ResponseEntity.internalServerError().body("AI scoring failed to process resumes.");
            }

            aiResponse.setJobId(job.getId());

            // Build map of original filename to MultipartFile for storage
            java.util.Map<String, MultipartFile> fileMap = new java.util.HashMap<>();
            for (MultipartFile f : files) {
                if (f.getOriginalFilename() != null) {
                    fileMap.put(f.getOriginalFilename().toLowerCase(java.util.Locale.ROOT), f);
                }
            }

            for (var rank : aiResponse.getRankings()) {
                java.util.Map<String, Object> breakdown = new java.util.LinkedHashMap<>();
                breakdown.put("explanation", rank.getRecruiter_explanation());
                breakdown.put("strengths", rank.getStrengths() != null ? rank.getStrengths() : List.of());
                breakdown.put("skill_gaps", rank.getSkill_gaps() != null ? rank.getSkill_gaps() : List.of());
                breakdown.put("top_matching_terms", rank.getTop_matching_terms() != null ? rank.getTop_matching_terms() : List.of());
                breakdown.put("skills_required_score", rank.getSkills_required_score());
                breakdown.put("skills_preferred_score", rank.getSkills_preferred_score());
                breakdown.put("experience_score", rank.getExperience_score());
                breakdown.put("education_score", rank.getEducation_score());
                breakdown.put("global_context_score", rank.getGlobal_context_score());

                String feedbackStr;
                try {
                    feedbackStr = new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(breakdown);
                } catch (Exception jsonEx) {
                    feedbackStr = rank.getRecruiter_explanation();
                }

                String resumePath = null;
                String fileHash = null;
                String rankKey = rank.getFilename() != null ? rank.getFilename().toLowerCase(java.util.Locale.ROOT) : "";
                MultipartFile matchedFile = fileMap.get(rankKey);
                if (matchedFile != null) {
                    try {
                        var stored = storage.store(matchedFile);
                        resumePath = stored.filename();
                        fileHash = stored.sha256();
                    } catch (Exception ignored) {}
                }

                Candidate candidate = candidateRepository.save(Candidate.builder()
                        .name(rank.getFilename())
                        .job(job)
                        .aiScore(rank.getFinal_score())
                        .aiFeedback(feedbackStr)
                        .resumeFilePath(resumePath)
                        .fileHash(fileHash)
                        .source("DIRECT_UPLOAD")
                        .stage("NEW")
                        .build());
                rank.setCandidateId(candidate.getId());
            }

            return ResponseEntity.ok(aiResponse);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Error processing resumes: " + e.getMessage());
        }
    }
}
