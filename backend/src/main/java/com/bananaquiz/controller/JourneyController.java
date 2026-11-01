
package com.bananaquiz.controller;

import com.bananaquiz.dto.AnswerResponse;
import com.bananaquiz.entity.User;
import com.bananaquiz.repository.UserRepository;
import com.bananaquiz.service.JourneyLevelConfig;
import com.bananaquiz.service.JourneyService;
import com.bananaquiz.service.JourneySession;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController
@RequestMapping("/api/journey")
public class JourneyController {

    private final JourneyService journeyService;
    private final UserRepository userRepository;

    public JourneyController(
            JourneyService journeyService,
            UserRepository userRepository
    ) {
        this.journeyService = journeyService;
        this.userRepository = userRepository;
    }

    public record JourneyAnswerRequest(
            @NotBlank String sessionId,
            @NotBlank String questionId,
            @NotNull Integer answer
    ) {}

    @PostMapping("/start")
    public Map<String, Object> startJourney(
            @AuthenticationPrincipal UserDetails principal
    ) {
        User user = getAuthenticatedUser(principal);

        JourneyLevelConfig config =
                JourneyLevelConfig.forLevel(user.getJourneyLevel());

        JourneyService.JourneyStartResult result =
                journeyService.startSession(user.getId(), config);

        JourneySession session = result.session();

        return Map.of(
                "sessionId", session.getSessionId(),
                "level", session.getLevel(),
                "requiredCorrectAnswers", session.getRequiredCorrectAnswers(),
                "correctAnswers", session.getCorrectAnswers(),
                "timeLimitSeconds", config.timeLimitSeconds(),
                "expiresAt", session.getExpiresAt().toString(),
                "xpReward", config.xpReward(),
                "questions", result.questions()
        );
    }


    @PostMapping("/answer")
    public JourneyService.JourneyAnswerResult submitJourneyAnswer(
            @AuthenticationPrincipal UserDetails principal,
            @Valid @RequestBody JourneyAnswerRequest request
    ) {
        User user = getAuthenticatedUser(principal);

        try {
            return journeyService.submitAnswer(
                    user.getId(),
                    request.sessionId(),
                    request.questionId(),
                    request.answer()
            );

        } catch (IllegalStateException exception) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    exception.getMessage()
            );
        }
    }


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
}
