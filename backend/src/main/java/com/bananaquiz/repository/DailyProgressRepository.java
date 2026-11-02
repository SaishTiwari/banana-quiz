
package com.bananaquiz.repository;

import com.bananaquiz.entity.DailyProgress;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.Optional;

public interface DailyProgressRepository
        extends JpaRepository<DailyProgress, Long> {

    Optional<DailyProgress> findByUserIdAndChallengeDate(
            Long userId,
            LocalDate challengeDate
    );

    Optional<DailyProgress> findTopByUserIdAndCompletedTrueOrderByChallengeDateDesc(
            Long userId
    );
}
