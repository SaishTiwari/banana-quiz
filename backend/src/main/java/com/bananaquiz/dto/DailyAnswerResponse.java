
package com.bananaquiz.dto;

public record DailyAnswerResponse(
        boolean correct,
        int correctAnswer,
        int answeredQuestions,
        int totalQuestions,
        boolean completed,
        int currentStreak,
        int longestStreak,
        int xpEarned
) {
}
