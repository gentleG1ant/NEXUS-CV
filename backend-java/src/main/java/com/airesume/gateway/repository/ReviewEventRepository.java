package com.airesume.gateway.repository;

import com.airesume.gateway.model.ReviewEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ReviewEventRepository extends JpaRepository<ReviewEvent, Long> {
    List<ReviewEvent> findByCandidateIdOrderByOccurredAtDesc(Long candidateId);
    void deleteByCandidateId(Long candidateId);
}
