
package com.bananaquiz.entity;

import jakarta.persistence.*;

@Entity
@Table(
        name = "battle_questions",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_battle_question_number",
                        columnNames = {"battle_room_id", "question_number"}
                )
        }
)
public class BattleQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "battle_room_id", nullable = false)
    private BattleRoom battleRoom;

    @Column(name = "question_number", nullable = false)
    private int questionNumber;

    @Column(name = "question_image_url", nullable = false, length = 2048)
    private String questionImageUrl;

    @Column(name = "correct_answer", nullable = false)
    private int correctAnswer;

    public BattleQuestion() {
    }

    public Long getId() {
        return id;
    }

    public BattleRoom getBattleRoom() {
        return battleRoom;
    }

    public void setBattleRoom(BattleRoom battleRoom) {
        this.battleRoom = battleRoom;
    }

    public int getQuestionNumber() {
        return questionNumber;
    }

    public void setQuestionNumber(int questionNumber) {
        this.questionNumber = questionNumber;
    }

    public String getQuestionImageUrl() {
        return questionImageUrl;
    }

    public void setQuestionImageUrl(String questionImageUrl) {
        this.questionImageUrl = questionImageUrl;
    }

    public int getCorrectAnswer() {
        return correctAnswer;
    }

    public void setCorrectAnswer(int correctAnswer) {
        this.correctAnswer = correctAnswer;
    }
}
