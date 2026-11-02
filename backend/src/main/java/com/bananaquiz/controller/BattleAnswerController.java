
package com.bananaquiz.controller;

import com.bananaquiz.entity.User;
import com.bananaquiz.repository.UserRepository;
import com.bananaquiz.service.BattleAnswerService;
import com.bananaquiz.service.BattleRoomService;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/battle/rooms")
public class BattleAnswerController {

    private final BattleAnswerService battleAnswerService;
    private final BattleRoomService battleRoomService;
    private final UserRepository userRepository;

    public BattleAnswerController(
            BattleAnswerService battleAnswerService,
            BattleRoomService battleRoomService,
            UserRepository userRepository
    ) {
        this.battleAnswerService = battleAnswerService;
        this.battleRoomService = battleRoomService;
        this.userRepository = userRepository;
    }

    public record SubmitAnswerRequest(
            @NotNull Long questionId,
            @NotNull Integer answer
    ) {
    }

    public record SubmitAnswerResponse(
            boolean correct,
            long score
    ) {
    }

    @PostMapping("/{roomCode}/answers")
    public SubmitAnswerResponse submitAnswer(
            @AuthenticationPrincipal UserDetails principal,
            @PathVariable String roomCode,
            @Valid @RequestBody SubmitAnswerRequest request
    ) {
        if (principal == null) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Login required"
            );
        }

        User user = userRepository
                .findByEmail(principal.getUsername())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "User not found"
                ));

        Long roomId = battleRoomService
                .getRoom(roomCode, user.getId())
                .getId();

        boolean correct = battleAnswerService.submitAnswer(
                roomId,
                request.questionId(),
                user.getId(),
                request.answer()
        );

        long score = battleAnswerService.getScore(
                roomId,
                user.getId()
        );

        return new SubmitAnswerResponse(correct, score);
    }
}
