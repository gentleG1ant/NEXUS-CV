package com.airesume.gateway.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.Instant;

@Entity
@Getter @Setter
@Table(name = "review_events")
public class ReviewEvent {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false)
    private Long candidateId;
    @Column(nullable = false)
    private String actor;
    @Column(nullable = false)
    private String fromStage;
    @Column(nullable = false)
    private String toStage;
    @Column(nullable = false, columnDefinition = "TEXT")
    private String reason;
    @Column(nullable = false, updatable = false)
    private Instant occurredAt = Instant.now();
}
