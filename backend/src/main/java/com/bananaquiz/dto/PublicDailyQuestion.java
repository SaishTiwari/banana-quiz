
package com.bananaquiz.dto;

public record PublicDailyQuestion(
        Long questionId,
        int questionNumber,
        String imageUrl,
        boolean answered
) {
}
