
package com.bananaquiz.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, unique = true, length = 255)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private int totalXp = 0;

    @Column(nullable = false)
    private int journeyLevel = 1;

    protected User() {
    }

    public User(String name, String email, String password) {
        this.name = name;
        this.email = email;
        this.password = password;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getEmail() {
        return email;
    }

    public String getPassword() {
        return password;
    }

    public int getTotalXp() {
        return totalXp;
    }

    public int getJourneyLevel() {
        return journeyLevel;
    }

    public void setTotalXp(int totalXp) {
        this.totalXp = totalXp;
    }

    public void setJourneyLevel(int journeyLevel) {
        this.journeyLevel = journeyLevel;
    }
}
