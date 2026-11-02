
package com.bananaquiz.controller;

import com.bananaquiz.dto.BattleQuestionResponse;
import com.bananaquiz.entity.BattleRoom;
import com.bananaquiz.entity.User;
import com.bananaquiz.repository.BattleQuestionRepository;
import com.bananaquiz.repository.UserRepository;
import com.bananaquiz.service.BattleRoomService;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/battle")
public class BattleRoomController {

    private final BattleRoomService battleRoomService;
    private final BattleQuestionRepository battleQuestionRepository;
    private final UserRepository userRepository;

    public BattleRoomController(
            BattleRoomService battleRoomService,
            BattleQuestionRepository battleQuestionRepository,
            UserRepository userRepository
    ) {
        this.battleRoomService = battleRoomService;
        this.battleQuestionRepository = battleQuestionRepository;
        this.userRepository = userRepository;
    }

    public record CreateBattleRoomRequest(
            Integer totalRounds
    ) {
    }

    public record BattleRoomResponse(
            Long roomId,
            String roomCode,
            String status,
            Long hostUserId,
            Long guestUserId,
            int totalRounds
    ) {
    }

    private User getAuthenticatedUser(UserDetails principal) {
        if (principal == null) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Login required"
            );
        }

        return userRepository
                .findByEmail(principal.getUsername())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "User not found"
                ));
    }

    private BattleRoomResponse toResponse(BattleRoom room) {
        return new BattleRoomResponse(
                room.getId(),
                room.getRoomCode(),
                room.getStatus().name(),
                room.getHostUserId(),
                room.getGuestUserId(),
                room.getTotalRounds()
        );
    }

    @PostMapping("/rooms")
    public BattleRoomResponse createRoom(
            @AuthenticationPrincipal UserDetails principal,
            @RequestBody(required = false)
            CreateBattleRoomRequest request
    ) {
        User user = getAuthenticatedUser(principal);

        int totalRounds = 5;

        if (request != null && request.totalRounds() != null) {
            totalRounds = request.totalRounds();
        }

        return toResponse(
                battleRoomService.createRoom(
                        user.getId(),
                        totalRounds
                )
        );
    }

    @PostMapping("/rooms/{roomCode}/join")
    public BattleRoomResponse joinRoom(
            @AuthenticationPrincipal UserDetails principal,
            @PathVariable String roomCode
    ) {
        User user = getAuthenticatedUser(principal);

        return toResponse(
                battleRoomService.joinRoom(
                        roomCode,
                        user.getId()
                )
        );
    }

    @GetMapping("/rooms/{roomCode}")
    public BattleRoomResponse getRoom(
            @AuthenticationPrincipal UserDetails principal,
            @PathVariable String roomCode
    ) {
        User user = getAuthenticatedUser(principal);

        return toResponse(
                battleRoomService.getRoom(
                        roomCode,
                        user.getId()
                )
        );
    }

    @PostMapping("/rooms/{roomCode}/start")
    public BattleRoomResponse startBattle(
            @AuthenticationPrincipal UserDetails principal,
            @PathVariable String roomCode
    ) {
        User user = getAuthenticatedUser(principal);

        return toResponse(
                battleRoomService.startBattle(
                        roomCode,
                        user.getId()
                )
        );
    }

    @GetMapping("/rooms/{roomCode}/questions")
    public List<BattleQuestionResponse> getQuestions(
            @AuthenticationPrincipal UserDetails principal,
            @PathVariable String roomCode
    ) {
        User user = getAuthenticatedUser(principal);

        // Verifies the user is the host or guest.
        BattleRoom room = battleRoomService.getRoom(
                roomCode,
                user.getId()
        );

        if (room.getStatus()
                != com.bananaquiz.entity.BattleStatus.IN_PROGRESS) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Battle has not started"
            );
        }

        return battleQuestionRepository
                .findByBattleRoomIdOrderByQuestionNumberAsc(
                        room.getId()
                )
                .stream()
                .map(question -> new BattleQuestionResponse(
                        question.getId(),
                        question.getQuestionNumber(),
                        question.getQuestionImageUrl()
                ))
                .toList();
    }
}
