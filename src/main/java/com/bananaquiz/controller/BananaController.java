
package com.bananaquiz.controller;

import com.bananaquiz.dto.BananaQuestion;
import com.bananaquiz.dto.PublicBananaQuestion;
import com.bananaquiz.service.BananaApiService;
import com.bananaquiz.service.QuestionStore;
import org.springframework.web.bind.annotation.GetMapping;
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

    @GetMapping("/question")
    public PublicBananaQuestion getQuestion() {

        // Fetching the question and solution from external API
        BananaQuestion bananaQuestion =
                bananaApiService.getQuestion();

        // Storing the correct answer on our server
        String questionId = questionStore.saveQuestion(
                bananaQuestion.solution()
        );

        // Returning only the question ID and image URL
        return new PublicBananaQuestion(
                questionId,
                bananaQuestion.question()
        );
    }
}
