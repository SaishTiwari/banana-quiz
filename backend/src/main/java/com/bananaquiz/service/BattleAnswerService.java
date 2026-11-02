
package com.bananaquiz.service;

import com.bananaquiz.entity.BattleAnswer;
import com.bananaquiz.entity.BattleQuestion;
import com.bananaquiz.entity.BattleRoom;
import com.bananaquiz.entity.BattleStatus;
import com.bananaquiz.repository.BattleAnswerRepository;
import com.bananaquiz.repository.BattleQuestionRepository;
import com.bananaquiz.repository.BattleRoomRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class BattleAnswerService {

    private final BattleAnswerRepository battleAnswerRepository;
    private final BattleQuestionRepository battleQuestionRepository;
    private final BattleRoomRepository battleRoomRepository;

    public BattleAnswerService(
            BattleAnswerRepository battleAnswerRepository,
            BattleQuestionRepository battleQuestionRepository,
            BattleRoomRepository battleRoomRepository
    ) {
        this.battleAnswerRepository = battleAnswerRepository;
        this.battleQuestionRepository = battleQuestionRepository;
        this.battleRoomRepository = battleRoomRepository;
    }

    @Transactional
    public boolean submitAnswer(
            Long battleRoomId,
            Long questionId,
            Long userId,
            int submittedAnswer
    ) {
        BattleRoom room = battleRoomRepository
                .findByIdForUpdate(battleRoomId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Battle room not found"
                ));

        boolean isHost = room.getHostUserId().equals(userId);
        boolean isGuest = userId.equals(room.getGuestUserId());

        if (!isHost && !isGuest) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You are not a participant in this battle"
            );
        }

        if (room.getStatus() != BattleStatus.IN_PROGRESS) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Battle is not in progress"
            );
        }

        BattleQuestion question = battleQuestionRepository
                .findById(questionId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Battle question not found"
                ));

        if (!question.getBattleRoom().getId().equals(room.getId())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Question does not belong to this battle"
            );
        }

        if (battleAnswerRepository.existsByBattleQuestionIdAndUserId(
                questionId,
                userId
        )) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "You have already answered this question"
            );
        }

        boolean correct =
                submittedAnswer == question.getCorrectAnswer();

        BattleAnswer answer = new BattleAnswer();
        answer.setBattleQuestion(question);
        answer.setUserId(userId);
        answer.setSubmittedAnswer(submittedAnswer);
        answer.setCorrect(correct);

        battleAnswerRepository.save(answer);

        return correct;
    }

    @Transactional(readOnly = true)
    public long getScore(Long battleRoomId, Long userId) {
        return battleAnswerRepository
                .countByBattleQuestionBattleRoomIdAndUserIdAndCorrectTrue(
                        battleRoomId,
                        userId
                );
    }
}
