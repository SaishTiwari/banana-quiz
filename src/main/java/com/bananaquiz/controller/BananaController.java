
package com.bananaquiz.controller;

import com.bananaquiz.dto.AnswerRequest;
import com.bananaquiz.dto.AnswerResponse;
import com.bananaquiz.dto.BananaQuestion;
import com.bananaquiz.dto.PublicBananaQuestion;
import com.bananaquiz.service.BananaApiService;
import com.bananaquiz.service.QuestionStore;

import jakarta.validation.Valid;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/banana")
public class BananaController {

    private final BananaApiService bananaApiService;
    private final QuestionStore questionStore;

    public BananaController(
            BananaApiService bananaApiService,
            QuestionStore questionStore
    ) {
        this.bananaApiService = bananaApiService;
        this.questionStore = questionStore;
    }

    // Fetch a new Banana question
    @GetMapping("/question")
    public PublicBananaQuestion getQuestion() {

        // Retrieve question from the external Banana API
        BananaQuestion bananaQuestion =
                bananaApiService.getQuestion();

        // Store the correct answer on our backend
        String questionId = questionStore.saveQuestion(
                bananaQuestion.solution()
        );

        // Return the question without exposing its solution
        return new PublicBananaQuestion(
                questionId,
                bananaQuestion.question()
        );
    }

    // Check the player's submitted answer
    @PostMapping("/answer")
    public AnswerResponse checkAnswer(
            @Valid @RequestBody AnswerRequest request
    ) {

        boolean correct = questionStore.checkAnswer(
                request.questionId(),
                request.answer()
        );

        String message = correct
                ? "Correct answer!"
                : "Incorrect answer!";

        return new AnswerResponse(correct, message);
    }
}
