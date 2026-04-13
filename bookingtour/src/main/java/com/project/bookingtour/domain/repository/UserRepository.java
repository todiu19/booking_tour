package com.project.bookingtour.domain.repository;

import com.project.bookingtour.common.enums.UserStatus;
import com.project.bookingtour.domain.entity.User;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    @EntityGraph(attributePaths = "role")
    @Override
    Optional<User> findById(Long id);

    @EntityGraph(attributePaths = "role")
    @Override
    Page<User> findAll(Pageable pageable);

    Optional<User> findByEmail(String email);

    @EntityGraph(attributePaths = "role")
    @Query("SELECT u FROM User u WHERE u.email = :email")
    Optional<User> findByEmailWithRole(@Param("email") String email);

    boolean existsByEmail(String email);

    boolean existsByPhone(String phone);

    boolean existsByEmailAndIdNot(String email, Long id);

    boolean existsByPhoneAndIdNot(String phone, Long id);

    long countByStatus(UserStatus status);
}
