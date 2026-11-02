
package com.bananaquiz.entity;

import jakarta.persistence.*;

@Entity
@Table(
        name = "daily_questions",
        uniqueConstraints = @UniqueConstraint(
                columnNames = {"daily_progress_id", "question_number"}
        )
)
public class DailyQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "daily_progress_id", nullable = false)
    private DailyProgress dailyProgress;

    @Column(name = "question_number", nullable = false)
    private int questionNumber;

    @Column(nullable = false, length = 2048)
    private String imageUrl;

    @Column(nullable = false)
    private int correctAnswer;

    @Column(nullable = false)
    private boolean answered = false;

    @Column(nullable = false)
    private boolean correct = false;

    public DailyQuestion() {
    }

    public Long getId() {
        return id;
    }

    public DailyProgress getDailyProgress() {
        return dailyProgress;
    }

    public void setDailyProgress(DailyProgress dailyProgress) {
        this.dailyProgress = dailyProgress;
    }

    public int getQuestionNumber() {
        return questionNumber;
    }

    public void setQuestionNumber(int questionNumber) {
        this.questionNumber = questionNumber;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public int getCorrectAnswer() {
        return correctAnswer;
    }

    public void setCorrectAnswer(int correctAnswer) {
        this.correctAnswer = correctAnswer;
    }

    public boolean isAnswered() {
        return answered;
    }

    public void setAnswered(boolean answered) {
        this.answered = answered;
    }

    public boolean isCorrect() {
        return correct;
    }

    public void setCorrect(boolean correct) {
        this.correct = correct;
    }
}
