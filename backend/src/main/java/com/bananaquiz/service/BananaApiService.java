
package com.bananaquiz.service;

import com.bananaquiz.dto.BananaQuestion;
import tools.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

@Service
public class BananaApiService {

    private static final String BANANA_API_URL =
            "https://marcconrad.com/uob/banana/api.php";

    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    public BananaApiService() {
        this.restClient = RestClient.create();
        this.objectMapper = new ObjectMapper();
    }

    public BananaQuestion getQuestion() {
        try {
            String response = restClient.get()
                    .uri(BANANA_API_URL)
                    .retrieve()
                    .body(String.class);

            return objectMapper.readValue(response, BananaQuestion.class);

        } catch (Exception e) {
            throw new IllegalStateException(
                    "Failed to fetch question from Banana API", e);
        }
    }
}
