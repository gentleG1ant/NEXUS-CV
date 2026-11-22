package com.airesume.gateway.repository;

import com.airesume.gateway.model.Candidate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CandidateRepository extends JpaRepository<Candidate, Long> {
    List<Candidate> findByJobId(Long jobId);
    List<Candidate> findByJobIdOrderByAiScoreDesc(Long jobId);
    boolean existsByEmailAndJobId(String email, Long jobId);
    boolean existsByEmailIgnoreCaseAndJobId(String email, Long jobId);
}
