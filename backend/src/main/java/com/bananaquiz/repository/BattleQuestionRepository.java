
package com.bananaquiz.repository;

import com.bananaquiz.entity.BattleQuestion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BattleQuestionRepository
        extends JpaRepository<BattleQuestion, Long> {

    List<BattleQuestion> findByBattleRoomIdOrderByQuestionNumberAsc(
            Long battleRoomId
    );

    boolean existsByBattleRoomId(Long battleRoomId);

    long countByBattleRoomId(Long battleRoomId);
}
