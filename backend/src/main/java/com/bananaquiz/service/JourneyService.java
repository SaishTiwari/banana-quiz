
package com.bananaquiz.service;

import com.bananaquiz.dto.BananaQuestion;
import com.bananaquiz.dto.PublicBananaQuestion;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

@Service
public class JourneyService {

    private final ConcurrentMap<Long, JourneySession> activeSessions =
            new ConcurrentHashMap<>();

    private final BananaApiService bananaApiService;
    private final QuestionStore questionStore;
    private final ProgressService progressService;

    public JourneyService(
            BananaApiService bananaApiService,
            QuestionStore questionStore,
            ProgressService progressService
    ) {
        this.bananaApiService = bananaApiService;
        this.questionStore = questionStore;
        this.progressService = progressService;
    }

    public record JourneyStartResult(
            JourneySession session,
            List<PublicBananaQuestion> questions
    ) {}

    public record JourneyAnswerResult(
            boolean correct,
            boolean completed,
            int correctAnswers,
            int requiredCorrectAnswers,
            int xpEarned,
            String message
    ) {}

    public JourneyStartResult startSession(
            Long userId,
            JourneyLevelConfig config
    ) {
        List<PublicBananaQuestion> questions = new ArrayList<>();

        for (int i = 0; i < config.requiredCorrectAnswers(); i++) {
            BananaQuestion bananaQuestion = bananaApiService.getQuestion();

            String questionId = questionStore.saveJourneyQuestion(
                    bananaQuestion.solution()
            );

            questions.add(new PublicBananaQuestion(
                    questionId,
                    bananaQuestion.question()
            ));
        }

        JourneySession session = new JourneySession(userId, config);

        for (PublicBananaQuestion question : questions) {
            session.addQuestion(question.questionId());
        }

        activeSessions.put(userId, session);

        return new JourneyStartResult(
                session,
                List.copyOf(questions)
        );
    }

    public JourneySession getActiveSession(Long userId) {
        JourneySession session = activeSessions.get(userId);

        if (session == null) {
            throw new IllegalStateException(
                    "No active Journey session"
            );
        }

        if (session.isExpired()) {
            activeSessions.remove(userId, session);

            throw new IllegalStateException(
                    "Journey session has expired"
            );
        }

        return session;
    }

    public JourneyAnswerResult submitAnswer(
            Long userId,
            String sessionId,
            String questionId,
            int answer
    ) {
        JourneySession session = getActiveSession(userId);

        synchronized (session) {

            if (activeSessions.get(userId) != session
                    || !session.getSessionId().equals(sessionId)) {
                throw new IllegalStateException(
                        "Invalid Journey session"
                );
            }

            if (session.isExpired()) {
                throw new IllegalStateException(
                        "Journey session has expired"
                );
            }

            if (session.isCompleted()) {
                throw new IllegalStateException(
                        "Journey level already completed"
                );
            }

            if (!session.consumeQuestion(questionId)) {
                throw new IllegalStateException(
                        "Question does not belong to this session or was already answered"
                );
            }

            boolean correct = questionStore.checkJourneyAnswer(
                    questionId,
                    answer
            );

            if (!correct) {
                activeSessions.remove(userId, session);

                return new JourneyAnswerResult(
                        false,
                        false,
                        session.getCorrectAnswers(),
                        session.getRequiredCorrectAnswers(),
                        0,
                        "Incorrect answer. Journey attempt failed."
                );
            }

            session.recordCorrectAnswer();

            if (!session.isCompleted()) {
                return new JourneyAnswerResult(
                        true,
                        false,
                        session.getCorrectAnswers(),
                        session.getRequiredCorrectAnswers(),
                        0,
                        "Correct answer!"
                );
            }

            boolean rewarded = progressService.completeJourneyLevel(
                    userId,
                    session.getLevel()
            );

            if (!rewarded) {
                activeSessions.remove(userId, session);

                throw new IllegalStateException(
                        "Journey level already rewarded or unavailable"
                );
            }

            session.markRewardClaimed();

            int xpEarned = JourneyLevelConfig
                    .forLevel(session.getLevel())
                    .xpReward();

            activeSessions.remove(userId, session);

            return new JourneyAnswerResult(
                    true,
                    true,
                    session.getCorrectAnswers(),
                    session.getRequiredCorrectAnswers(),
                    xpEarned,
                    "Level completed!"
            );
        }
    }

    public void endSession(Long userId) {
        activeSessions.remove(userId);
    }
}
