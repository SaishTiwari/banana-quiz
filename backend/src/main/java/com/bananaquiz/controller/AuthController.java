
package com.bananaquiz.controller;

import com.bananaquiz.dto.LoginRequest;
import com.bananaquiz.dto.RegisterRequest;
import com.bananaquiz.service.AuthService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;

import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;

import java.util.Locale;
import java.util.Map;

import com.bananaquiz.entity.User;
import com.bananaquiz.repository.UserRepository;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;

    private final SecurityContextRepository securityContextRepository =
            new HttpSessionSecurityContextRepository();

    public AuthController(
            AuthService authService,
            AuthenticationManager authenticationManager,
            UserRepository userRepository
    ) {
        this.authService = authService;
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
    }



    @PostMapping("/register")
    public ResponseEntity<Map<String, String>> register(
            @Valid @RequestBody RegisterRequest request
    ) {
        authService.register(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(Map.of(
                        "message", "User registered successfully"
                ));
    }


    @GetMapping("/me")
    public ResponseEntity<?> currentUser(
            @AuthenticationPrincipal UserDetails principal
    ) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Not authenticated"));
        }

        return userRepository.findByEmail(principal.getUsername())
                .<ResponseEntity<?>>map(user -> ResponseEntity.ok(
                        Map.of(
                                "id", user.getId(),
                                "name", user.getName(),
                                "email", user.getEmail(),
                                "totalXp", user.getTotalXp(),
                                "journeyLevel", user.getJourneyLevel()
                        )
                ))
                .orElseGet(() -> ResponseEntity
                        .status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "User not found")));
    }


    @GetMapping("/csrf")
    public CsrfToken csrf(CsrfToken csrfToken) {
        return csrfToken;
    }



    @PostMapping("/login")
    public ResponseEntity<Map<String, String>> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse
    ) {
        String email = request.email()
                .trim()
                .toLowerCase(Locale.ROOT);

        Authentication authentication =
                authenticationManager.authenticate(
                        new UsernamePasswordAuthenticationToken(
                                email,
                                request.password()
                        )
                );

        SecurityContext context =
                SecurityContextHolder.createEmptyContext();

        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);

        if (httpRequest.getSession(false) != null) {
            httpRequest.changeSessionId();
        }

        securityContextRepository.saveContext(
                context,
                httpRequest,
                httpResponse
        );

        return ResponseEntity.ok(
                Map.of("message", "Login successful")
        );
    }
}
