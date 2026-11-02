
package com.bananaquiz.dto;

import jakarta.validation.constraints.NotNull;

public record DailyAnswerRequest(
        @NotNull Long questionId,
        @NotNull Integer answer
) {
}
