
package com.bananaquiz.service;

import com.bananaquiz.entity.BattleRoom;
import com.bananaquiz.entity.BattleStatus;
import com.bananaquiz.repository.BattleRoomRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Locale;
import java.util.Set;

@Service
public class BattleRoomService {

    private static final String CODE_CHARACTERS =
            "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    private static final int CODE_LENGTH = 6;
    private static final int MAX_CODE_ATTEMPTS = 10;

    private static final Set<Integer> ALLOWED_ROUNDS =
            Set.of(3, 5, 10, 15);

    private final BattleRoomRepository battleRoomRepository;
    private final BattleQuestionService battleQuestionService;

    private final SecureRandom secureRandom = new SecureRandom();

    public BattleRoomService(
            BattleRoomRepository battleRoomRepository,
            BattleQuestionService battleQuestionService
    ) {
        this.battleRoomRepository = battleRoomRepository;
        this.battleQuestionService = battleQuestionService;
    }

    @Transactional
    public BattleRoom createRoom(
            Long hostUserId,
            int totalRounds
    ) {
        if (!ALLOWED_ROUNDS.contains(totalRounds)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Rounds must be 3, 5, 10, or 15"
            );
        }

        for (int attempt = 0;
             attempt < MAX_CODE_ATTEMPTS;
             attempt++) {

            String roomCode = generateRoomCode();

            if (!battleRoomRepository.existsByRoomCode(roomCode)) {

                BattleRoom room = new BattleRoom();

                room.setRoomCode(roomCode);
                room.setHostUserId(hostUserId);
                room.setStatus(BattleStatus.WAITING);
                room.setTotalRounds(totalRounds);

                return battleRoomRepository.save(room);
            }
        }

        throw new ResponseStatusException(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "Unable to generate a unique room code"
        );
    }

    @Transactional
    public BattleRoom joinRoom(
            String roomCode,
            Long guestUserId
    ) {
        String normalizedCode = normalizeRoomCode(roomCode);

        BattleRoom room = battleRoomRepository
                .findByRoomCodeForUpdate(normalizedCode)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Battle room not found"
                ));

        if (room.getHostUserId().equals(guestUserId)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Host cannot join as guest"
            );
        }

        if (room.getStatus() != BattleStatus.WAITING) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Battle is not accepting players"
            );
        }

        if (room.getGuestUserId() != null) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Battle room is already full"
            );
        }

        room.setGuestUserId(guestUserId);

        return battleRoomRepository.save(room);
    }

    @Transactional(readOnly = true)
    public BattleRoom getRoom(
            String roomCode,
            Long userId
    ) {
        String normalizedCode = normalizeRoomCode(roomCode);

        BattleRoom room = battleRoomRepository
                .findByRoomCode(normalizedCode)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Battle room not found"
                ));

        boolean isHost = room.getHostUserId().equals(userId);

        boolean isGuest = userId != null
                && userId.equals(room.getGuestUserId());

        if (!isHost && !isGuest) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You are not a participant in this battle"
            );
        }

        return room;
    }

    @Transactional
    public BattleRoom startBattle(
            String roomCode,
            Long hostUserId
    ) {
        String normalizedCode = normalizeRoomCode(roomCode);

        BattleRoom room = battleRoomRepository
                .findByRoomCodeForUpdate(normalizedCode)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Battle room not found"
                ));

        if (!room.getHostUserId().equals(hostUserId)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Only the host can start this battle"
            );
        }

        if (room.getStatus() != BattleStatus.WAITING) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "This battle has already started or finished"
            );
        }

        if (room.getGuestUserId() == null) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Two players are required to start a battle"
            );
        }

        // Generate and save all questions before starting.
        // This uses the room lock and transaction already held.
        battleQuestionService.generateQuestionsForLockedRoom(room);

        room.setStatus(BattleStatus.IN_PROGRESS);
        room.setStartedAt(LocalDateTime.now());

        return battleRoomRepository.save(room);
    }

    private String normalizeRoomCode(String roomCode) {
        if (roomCode == null || roomCode.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Room code is required"
            );
        }

        return roomCode.trim().toUpperCase(Locale.ROOT);
    }

    private String generateRoomCode() {
        StringBuilder code = new StringBuilder(CODE_LENGTH);

        for (int i = 0; i < CODE_LENGTH; i++) {
            int index = secureRandom.nextInt(
                    CODE_CHARACTERS.length()
            );

            code.append(CODE_CHARACTERS.charAt(index));
        }

        return code.toString();
    }
}
