package com.airesume.gateway.repository;

import com.airesume.gateway.model.Job;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Collection;
import java.util.List;

@Repository
public interface JobRepository extends JpaRepository<Job, Long> {
    List<Job> findByStatusOrderByCreatedAtDesc(String status);
    List<Job> findByStatusInOrderByCreatedAtDesc(Collection<String> statuses);
}
