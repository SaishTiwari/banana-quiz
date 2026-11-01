
package com.bananaquiz.controller;

import com.bananaquiz.dto.DailyAnswerRequest;
import com.bananaquiz.dto.DailyAnswerResponse;
import com.bananaquiz.dto.PublicDailyQuestion;
import com.bananaquiz.entity.DailyProgress;
import com.bananaquiz.entity.DailyQuestion;
import com.bananaquiz.entity.User;
import com.bananaquiz.repository.DailyProgressRepository;
import com.bananaquiz.repository.UserRepository;
import com.bananaquiz.service.DailyBananaService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;

@RestController
@RequestMapping("/api/daily")
public class DailyBananaController {

    private final DailyBananaService dailyBananaService;
    private final DailyProgressRepository dailyProgressRepository;
    private final UserRepository userRepository;

    public DailyBananaController(
            DailyBananaService dailyBananaService,
            DailyProgressRepository dailyProgressRepository,
            UserRepository userRepository
    ) {
        this.dailyBananaService = dailyBananaService;
        this.dailyProgressRepository = dailyProgressRepository;
        this.userRepository = userRepository;
    }

    public record DailyTodayResponse(
            LocalDate date,
            int answeredQuestions,
            int totalQuestions,
            boolean completed,
            int currentStreak,
            int longestStreak,
            List<PublicDailyQuestion> questions
    ) {}

    private User getAuthenticatedUser(UserDetails principal) {
        if (principal == null) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Login required"
            );
        }

        return userRepository.findByEmail(principal.getUsername())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "User not found"
                ));
    }

    @GetMapping("/today")
    public DailyTodayResponse getToday(
            @AuthenticationPrincipal UserDetails principal
    ) {
        User user = getAuthenticatedUser(principal);

        List<DailyQuestion> questions =
                dailyBananaService.getTodayQuestions(user.getId());

        DailyProgress progress = dailyProgressRepository
                .findByUserIdAndChallengeDate(
                        user.getId(),
                        LocalDate.now(ZoneOffset.UTC)
                )
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Daily progress not found"
                ));

        List<PublicDailyQuestion> publicQuestions = questions.stream()
                .map(question -> new PublicDailyQuestion(
                        question.getId(),
                        question.getQuestionNumber(),
                        question.getImageUrl(),
                        question.isAnswered()
                ))
                .toList();

        return new DailyTodayResponse(
                progress.getChallengeDate(),
                progress.getAnsweredQuestions(),
                5,
                progress.isCompleted(),
                progress.getCurrentStreak(),
                progress.getLongestStreak(),
                publicQuestions
        );
    }

    @PostMapping("/answer")
    public DailyAnswerResponse submitAnswer(
            @AuthenticationPrincipal UserDetails principal,
            @Valid @RequestBody DailyAnswerRequest request
    ) {
        User user = getAuthenticatedUser(principal);

        return dailyBananaService.submitDailyAnswer(
                user.getId(),
                request.questionId(),
                request.answer()
        );
    }
}
