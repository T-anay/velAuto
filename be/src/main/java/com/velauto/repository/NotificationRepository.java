package com.velauto.repository;

import com.velauto.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Integer> {
    List<Notification> findByUserIdAndIsReadFalseOrderBySentAtDesc(Integer userId);
    List<Notification> findByUserIdOrderBySentAtDesc(Integer userId);
}
