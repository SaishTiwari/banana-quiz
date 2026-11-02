
package com.bananaquiz.repository;

import com.bananaquiz.entity.BattleRoom;

import jakarta.persistence.LockModeType;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface BattleRoomRepository
        extends JpaRepository<BattleRoom, Long> {

    Optional<BattleRoom> findByRoomCode(String roomCode);

    boolean existsByRoomCode(String roomCode);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT room
            FROM BattleRoom room
            WHERE room.roomCode = :roomCode
            """)
    Optional<BattleRoom> findByRoomCodeForUpdate(
            @Param("roomCode") String roomCode
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT room
            FROM BattleRoom room
            WHERE room.id = :roomId
            """)
    Optional<BattleRoom> findByIdForUpdate(
            @Param("roomId") Long roomId
    );
}
