
package com.bananaquiz.repository;

import com.bananaquiz.entity.BattleAnswer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BattleAnswerRepository
        extends JpaRepository<BattleAnswer, Long> {

    boolean existsByBattleQuestionIdAndUserId(
            Long battleQuestionId,
            Long userId
    );

    List<BattleAnswer> findByBattleQuestionBattleRoomIdAndUserId(
            Long battleRoomId,
            Long userId
    );

    long countByBattleQuestionBattleRoomIdAndUserIdAndCorrectTrue(
            Long battleRoomId,
            Long userId
    );
}
