package com.project.bookingtour.domain.repository;

import com.project.bookingtour.domain.entity.Invoice;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, Long> {

    Optional<Invoice> findByInvoiceNo(String invoiceNo);

    Optional<Invoice> findByBooking_Id(Long bookingId);

    List<Invoice> findByBooking_IdIn(List<Long> bookingIds);

    Optional<Invoice> findByIdAndUser_Id(Long id, Long userId);

    boolean existsByUser_Id(Long userId);
}
