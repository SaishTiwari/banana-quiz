
package com.bananaquiz.entity;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(
        name = "daily_progress",
        uniqueConstraints = @UniqueConstraint(
                columnNames = {"user_id", "challenge_date"}
        )
)
public class DailyProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "challenge_date", nullable = false)
    private LocalDate challengeDate;

    @Column(nullable = false)
    private int answeredQuestions = 0;

    @Column(nullable = false)
    private boolean completed = false;

    @Column(nullable = false)
    private int currentStreak = 0;

    @Column(nullable = false)
    private int longestStreak = 0;

    public DailyProgress() {
    }

    public Long getId() {
        return id;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public LocalDate getChallengeDate() {
        return challengeDate;
    }

    public void setChallengeDate(LocalDate challengeDate) {
        this.challengeDate = challengeDate;
    }

    public int getAnsweredQuestions() {
        return answeredQuestions;
    }

    public void setAnsweredQuestions(int answeredQuestions) {
        this.answeredQuestions = answeredQuestions;
    }

    public boolean isCompleted() {
        return completed;
    }

    public void setCompleted(boolean completed) {
        this.completed = completed;
    }

    public int getCurrentStreak() {
        return currentStreak;
    }

    public void setCurrentStreak(int currentStreak) {
        this.currentStreak = currentStreak;
    }

    public int getLongestStreak() {
        return longestStreak;
    }

    public void setLongestStreak(int longestStreak) {
        this.longestStreak = longestStreak;
    }
}
