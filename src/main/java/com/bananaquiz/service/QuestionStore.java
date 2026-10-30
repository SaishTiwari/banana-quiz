
package com.bananaquiz.service;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

@Service
public class QuestionStore {

    private final ConcurrentMap<String, Integer> answers =
            new ConcurrentHashMap<>();

    public String saveQuestion(int solution) {
        String questionId = UUID.randomUUID().toString();
        answers.put(questionId, solution);
        return questionId;
    }

    public boolean checkAnswer(String questionId, int answer) {
        Integer correctAnswer = answers.remove(questionId);

        if (correctAnswer == null) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Question not found or already answered"
            );
        }

        return correctAnswer == answer;
    }
}
