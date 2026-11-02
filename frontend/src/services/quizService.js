
import { apiRequest } from "./api";

export const quizService = {
  getQuestion() {
    return apiRequest("/banana/question");
  },

  submitAnswer(questionId, answer) {
    return apiRequest("/banana/answer", {
      method: "POST",
      body: JSON.stringify({
        questionId,
        answer,
      }),
    });
  },
};
