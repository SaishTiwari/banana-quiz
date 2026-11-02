
package com.bananaquiz.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "battle_answers",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_battle_answer_player_question",
                        columnNames = {"battle_question_id", "user_id"}
                )
        }
)
public class BattleAnswer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "battle_question_id", nullable = false)
    private BattleQuestion battleQuestion;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "submitted_answer", nullable = false)
    private int submittedAnswer;

    @Column(name = "is_correct", nullable = false)
    private boolean correct;

    @Column(name = "answered_at", nullable = false)
    private LocalDateTime answeredAt;

    public BattleAnswer() {
    }

    @PrePersist
    protected void onCreate() {
        if (answeredAt == null) {
            answeredAt = LocalDateTime.now();
        }
    }

    public Long getId() {
        return id;
    }

    public BattleQuestion getBattleQuestion() {
        return battleQuestion;
    }

    public void setBattleQuestion(BattleQuestion battleQuestion) {
        this.battleQuestion = battleQuestion;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public int getSubmittedAnswer() {
        return submittedAnswer;
    }

    public void setSubmittedAnswer(int submittedAnswer) {
        this.submittedAnswer = submittedAnswer;
    }

    public boolean isCorrect() {
        return correct;
    }

    public void setCorrect(boolean correct) {
        this.correct = correct;
    }

    public LocalDateTime getAnsweredAt() {
        return answeredAt;
    }

    public void setAnsweredAt(LocalDateTime answeredAt) {
        this.answeredAt = answeredAt;
    }
}
