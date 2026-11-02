
package com.bananaquiz.service;

import com.bananaquiz.dto.BananaQuestion;
import com.bananaquiz.dto.DailyAnswerResponse;
import com.bananaquiz.entity.DailyProgress;
import com.bananaquiz.entity.DailyQuestion;
import com.bananaquiz.entity.User;
import com.bananaquiz.repository.DailyProgressRepository;
import com.bananaquiz.repository.DailyQuestionRepository;
import com.bananaquiz.repository.UserRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;

@Service
public class DailyBananaService {

    private static final int DAILY_QUESTION_LIMIT = 5;
    private static final int DAILY_XP_REWARD = 100;

    private final DailyProgressRepository dailyProgressRepository;
    private final DailyQuestionRepository dailyQuestionRepository;
    private final BananaApiService bananaApiService;
    private final UserRepository userRepository;

    public DailyBananaService(
            DailyProgressRepository dailyProgressRepository,
            DailyQuestionRepository dailyQuestionRepository,
            BananaApiService bananaApiService,
            UserRepository userRepository
    ) {
        this.dailyProgressRepository = dailyProgressRepository;
        this.dailyQuestionRepository = dailyQuestionRepository;
        this.bananaApiService = bananaApiService;
        this.userRepository = userRepository;
    }

    private User lockUser(Long userId) {
        return userRepository.findWithLockById(userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "User not found"
                ));
    }

    private DailyProgress findOrCreateTodayProgress(Long userId) {
        LocalDate today = LocalDate.now(ZoneOffset.UTC);

        return dailyProgressRepository
                .findByUserIdAndChallengeDate(userId, today)
                .orElseGet(() -> {
                    DailyProgress progress = new DailyProgress();

                    progress.setUserId(userId);
                    progress.setChallengeDate(today);
                    progress.setAnsweredQuestions(0);
                    progress.setCompleted(false);

                    Optional<DailyProgress> previousCompletion =
                            dailyProgressRepository
                                    .findTopByUserIdAndCompletedTrueOrderByChallengeDateDesc(
                                            userId
                                    );

                    if (previousCompletion.isPresent()) {
                        DailyProgress previous = previousCompletion.get();

                        progress.setLongestStreak(
                                previous.getLongestStreak()
                        );

                        if (previous.getChallengeDate().equals(today.minusDays(1))) {
                            progress.setCurrentStreak(
                                    previous.getCurrentStreak()
                            );
                        } else {
                            progress.setCurrentStreak(0);
                        }
                    }

                    return dailyProgressRepository.save(progress);
                });
    }

    @Transactional
    public DailyProgress getTodayProgress(Long userId) {
        lockUser(userId);
        return findOrCreateTodayProgress(userId);
    }

    @Transactional
    public List<DailyQuestion> getTodayQuestions(Long userId) {
        lockUser(userId);

        DailyProgress progress = findOrCreateTodayProgress(userId);

        List<DailyQuestion> existingQuestions =
                dailyQuestionRepository
                        .findByDailyProgressIdOrderByQuestionNumberAsc(
                                progress.getId()
                        );

        if (!existingQuestions.isEmpty()) {
            return existingQuestions;
        }

        for (int i = 1; i <= DAILY_QUESTION_LIMIT; i++) {
            BananaQuestion bananaQuestion = bananaApiService.getQuestion();

            DailyQuestion dailyQuestion = new DailyQuestion();

            dailyQuestion.setDailyProgress(progress);
            dailyQuestion.setQuestionNumber(i);
            dailyQuestion.setImageUrl(bananaQuestion.question());
            dailyQuestion.setCorrectAnswer(bananaQuestion.solution());
            dailyQuestion.setAnswered(false);
            dailyQuestion.setCorrect(false);

            dailyQuestionRepository.save(dailyQuestion);
        }

        return dailyQuestionRepository
                .findByDailyProgressIdOrderByQuestionNumberAsc(
                        progress.getId()
                );
    }

    @Transactional
    public DailyAnswerResponse submitDailyAnswer(
            Long userId,
            Long questionId,
            int submittedAnswer
    ) {
        User user = lockUser(userId);

        DailyProgress progress = findOrCreateTodayProgress(userId);

        if (progress.isCompleted()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Today's Daily Banana challenge is already completed"
            );
        }

        DailyQuestion question = dailyQuestionRepository
                .findByIdAndDailyProgressId(
                        questionId,
                        progress.getId()
                )
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Question not found in today's challenge"
                ));

        if (question.isAnswered()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "This question has already been answered"
            );
        }

        boolean correct = question.getCorrectAnswer() == submittedAnswer;

        question.setAnswered(true);
        question.setCorrect(correct);
        dailyQuestionRepository.save(question);

        int answeredCount = progress.getAnsweredQuestions() + 1;
        progress.setAnsweredQuestions(answeredCount);

        int xpEarned = 0;

        if (answeredCount == DAILY_QUESTION_LIMIT) {
            LocalDate today = progress.getChallengeDate();

            Optional<DailyProgress> previousCompletion =
                    dailyProgressRepository
                            .findTopByUserIdAndCompletedTrueOrderByChallengeDateDesc(
                                    userId
                            );

            int newStreak = 1;
            int previousLongest = progress.getLongestStreak();

            if (previousCompletion.isPresent()) {
                DailyProgress previous = previousCompletion.get();

                previousLongest = Math.max(
                        previousLongest,
                        previous.getLongestStreak()
                );

                if (previous.getChallengeDate().equals(today.minusDays(1))) {
                    newStreak = previous.getCurrentStreak() + 1;
                }
            }

            progress.setCurrentStreak(newStreak);
            progress.setLongestStreak(
                    Math.max(previousLongest, newStreak)
            );
            progress.setCompleted(true);

            user.setTotalXp(user.getTotalXp() + DAILY_XP_REWARD);
            userRepository.save(user);

            xpEarned = DAILY_XP_REWARD;
        }

        dailyProgressRepository.save(progress);

        return new DailyAnswerResponse(
                correct,
                question.getCorrectAnswer(),
                progress.getAnsweredQuestions(),
                DAILY_QUESTION_LIMIT,
                progress.isCompleted(),
                progress.getCurrentStreak(),
                progress.getLongestStreak(),
                xpEarned
        );
    }
}
