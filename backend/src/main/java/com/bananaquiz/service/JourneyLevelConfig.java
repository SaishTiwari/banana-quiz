
package com.bananaquiz.service;

public record JourneyLevelConfig(
        int level,
        int requiredCorrectAnswers,
        int timeLimitSeconds,
        int xpReward
) {

    private static final int MAX_LEVEL = 10;

    public static JourneyLevelConfig forLevel(int level) {

        if (level < 1 || level > MAX_LEVEL) {
            throw new IllegalArgumentException(
                    "Invalid Journey level: " + level
            );
        }

        int requiredAnswers = (level * (level + 1)) / 6 + 1;

        int timeLimit = 15 + ((level - 1) / 2) * 5;

        int xpReward = level * 50;

        return new JourneyLevelConfig(
                level,
                requiredAnswers,
                timeLimit,
                xpReward
        );
    }
}
