
package com.bananaquiz.repository;

import com.bananaquiz.entity.DailyQuestion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DailyQuestionRepository
        extends JpaRepository<DailyQuestion, Long> {

    List<DailyQuestion> findByDailyProgressIdOrderByQuestionNumberAsc(
            Long dailyProgressId
    );

    Optional<DailyQuestion> findByIdAndDailyProgressId(
            Long questionId,
            Long dailyProgressId
    );

    long countByDailyProgressId(
            Long dailyProgressId
    );
}
