
package com.bananaquiz.service;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

@Service
public class QuestionStore {

    private final ConcurrentMap<String, Integer> classicAnswers =
            new ConcurrentHashMap<>();

    private final ConcurrentMap<String, Integer> journeyAnswers =
            new ConcurrentHashMap<>();

    public String saveQuestion(int solution) {
        String questionId = UUID.randomUUID().toString();
        classicAnswers.put(questionId, solution);
        return questionId;
    }

    public String saveJourneyQuestion(int solution) {
        String questionId = UUID.randomUUID().toString();
        journeyAnswers.put(questionId, solution);
        return questionId;
    }

    public boolean checkAnswer(String questionId, int answer) {
        Integer correctAnswer = classicAnswers.remove(questionId);

        if (correctAnswer == null) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Question not found or already answered"
            );
        }

        return correctAnswer == answer;
    }

    public boolean checkJourneyAnswer(String questionId, int answer) {
        Integer correctAnswer = journeyAnswers.remove(questionId);

        if (correctAnswer == null) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Journey question not found or already answered"
            );
        }

        return correctAnswer == answer;
    }
}
