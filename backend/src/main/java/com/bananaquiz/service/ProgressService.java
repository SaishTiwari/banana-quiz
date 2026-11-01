
package com.bananaquiz.service;

import com.bananaquiz.entity.User;
import com.bananaquiz.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
}
