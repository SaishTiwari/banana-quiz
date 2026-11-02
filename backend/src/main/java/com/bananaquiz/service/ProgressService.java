
package com.bananaquiz.service;

import com.bananaquiz.entity.User;
import com.bananaquiz.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ProgressService {

    private final UserRepository userRepository;

    public ProgressService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional
    public void awardXp(Long userId, int xp) {

        if (xp <= 0) {
            throw new IllegalArgumentException("XP must be positive");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() ->
                        new IllegalArgumentException("User not found")
                );

        user.setTotalXp(Math.addExact(user.getTotalXp(), xp));
        userRepository.save(user);
    }


    @Transactional
    public boolean completeJourneyLevel(Long userId, int completedLevel) {

        User user = userRepository.findWithLockById(userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "User not found"
                ));

        if (user.getJourneyLevel() != completedLevel) {
            return false;
        }

        JourneyLevelConfig config =
                JourneyLevelConfig.forLevel(completedLevel);

        user.setTotalXp(
                Math.addExact(user.getTotalXp(), config.xpReward())
        );

        if (completedLevel < 10) {
            user.setJourneyLevel(completedLevel + 1);
        } else {
            // Level 10 remains the highest unlocked level.
            // A separate completion marker is needed before
            // rewarding the final level.
            return false;
        }

        userRepository.save(user);

        return true;
    }

}
