
package com.bananaquiz.dto;

public record BattleQuestionResponse(
        Long questionId,
        int questionNumber,
        String questionImageUrl
) {
}
