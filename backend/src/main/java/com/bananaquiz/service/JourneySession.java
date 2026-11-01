
package com.bananaquiz.service;

import java.time.Instant;
import java.util.UUID;
import java.util.Set;
import java.util.HashSet;

public class JourneySession {

    private final String sessionId;
    private final Long userId;
    private final int level;
    private final Instant expiresAt;
    private final int requiredCorrectAnswers;
    private final Set<String> questionIds = new HashSet<>();
    private boolean rewardClaimed = false;

    private int correctAnswers;

    public JourneySession(
            Long userId,
            JourneyLevelConfig config
    ) {
        this.sessionId = UUID.randomUUID().toString();
        this.userId = userId;
        this.level = config.level();
        this.requiredCorrectAnswers = config.requiredCorrectAnswers();
        this.expiresAt = Instant.now()
                .plusSeconds(config.timeLimitSeconds());
        this.correctAnswers = 0;
    }

    public String getSessionId() {
        return sessionId;
    }

    public Long getUserId() {
        return userId;
    }

    public int getLevel() {
        return level;
    }

    public int getCorrectAnswers() {
        return correctAnswers;
    }

    public int getRequiredCorrectAnswers() {
        return requiredCorrectAnswers;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public boolean isExpired() {
        return !Instant.now().isBefore(expiresAt);
    }

    public boolean isCompleted() {
        return correctAnswers >= requiredCorrectAnswers;
    }

    public void recordCorrectAnswer() {
        if (isExpired()) {
            throw new IllegalStateException("Journey session has expired");
        }

        if (isCompleted()) {
            throw new IllegalStateException("Journey already completed");
        }

        correctAnswers++;
    }

    public void addQuestion(String questionId) {
        questionIds.add(questionId);
    }

    public boolean ownsQuestion(String questionId) {
        return questionIds.contains(questionId);
    }

    public boolean consumeQuestion(String questionId) {
        return questionIds.remove(questionId);
    }

    public boolean isRewardClaimed() {
        return rewardClaimed;
    }

    public void markRewardClaimed() {
        if (!isCompleted()) {
            throw new IllegalStateException(
                    "Cannot reward an incomplete Journey"
            );
        }

        if (rewardClaimed) {
            throw new IllegalStateException(
                    "Journey reward already claimed"
            );
        }

        rewardClaimed = true;
    }

}
