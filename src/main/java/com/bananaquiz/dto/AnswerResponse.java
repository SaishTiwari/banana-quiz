
package com.bananaquiz.dto;

public record AnswerResponse(
        boolean correct,
        String message
) {
}
