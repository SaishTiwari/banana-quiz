
package com.bananaquiz.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record AnswerRequest(
        @NotBlank String questionId,
        @NotNull Integer answer
) {
}
