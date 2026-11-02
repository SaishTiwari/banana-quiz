
package com.bananaquiz.service;

import com.bananaquiz.dto.BananaQuestion;
import com.bananaquiz.entity.BattleQuestion;
import com.bananaquiz.entity.BattleRoom;
import com.bananaquiz.entity.BattleStatus;
import com.bananaquiz.repository.BattleQuestionRepository;
import com.bananaquiz.repository.BattleRoomRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;

@Service
public class BattleQuestionService {

    private final BananaApiService bananaApiService;
    private final BattleQuestionRepository battleQuestionRepository;
    private final BattleRoomRepository battleRoomRepository;

    public BattleQuestionService(
            BananaApiService bananaApiService,
            BattleQuestionRepository battleQuestionRepository,
            BattleRoomRepository battleRoomRepository
    ) {
        this.bananaApiService = bananaApiService;
        this.battleQuestionRepository = battleQuestionRepository;
        this.battleRoomRepository = battleRoomRepository;
    }

    @Transactional
    public List<BattleQuestion> generateQuestions(Long battleRoomId) {

        BattleRoom room = battleRoomRepository
                .findByIdForUpdate(battleRoomId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Battle room not found"
                ));

        return generateQuestionsForLockedRoom(room);
    }

    // Called when the caller already holds the battle room lock.
    // Must run within the caller's transaction.
    @Transactional(propagation =
            org.springframework.transaction.annotation.Propagation.MANDATORY)
    public List<BattleQuestion> generateQuestionsForLockedRoom(
            BattleRoom room
    ) {
        if (room.getStatus() != BattleStatus.WAITING) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Battle must be waiting for players"
            );
        }

        if (room.getGuestUserId() == null) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Two players are required"
            );
        }

        if (battleQuestionRepository.existsByBattleRoomId(
                room.getId()
        )) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Questions already generated for this battle"
            );
        }

        int totalRounds = room.getTotalRounds();

        List<BattleQuestion> questions = new ArrayList<>();

        for (int round = 1; round <= totalRounds; round++) {

            BananaQuestion bananaQuestion =
                    bananaApiService.getQuestion();

            if (bananaQuestion == null
                    || bananaQuestion.question() == null
                    || bananaQuestion.question().isBlank()) {
                throw new IllegalStateException(
                        "Banana API returned an invalid question"
                );
            }

            BattleQuestion battleQuestion = new BattleQuestion();

            battleQuestion.setBattleRoom(room);
            battleQuestion.setQuestionNumber(round);
            battleQuestion.setQuestionImageUrl(
                    bananaQuestion.question()
            );
            battleQuestion.setCorrectAnswer(
                    bananaQuestion.solution()
            );

            questions.add(battleQuestion);
        }

        return battleQuestionRepository.saveAll(questions);
    }

    @Transactional(readOnly = true)
    public long countQuestions(Long battleRoomId) {
        return battleQuestionRepository.countByBattleRoomId(
                battleRoomId
        );
    }
}
