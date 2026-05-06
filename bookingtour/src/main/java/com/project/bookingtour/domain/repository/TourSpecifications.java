package com.project.bookingtour.domain.repository;

import com.project.bookingtour.common.enums.TourStatus;
import com.project.bookingtour.domain.entity.Tour;
import com.project.bookingtour.domain.entity.TourDeparture;
import com.project.bookingtour.domain.entity.TourDestination;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import org.springframework.data.jpa.domain.Specification;

public final class TourSpecifications {

    private TourSpecifications() {}

    /**
     * Tour {@link TourStatus#published} với bộ lọc tùy chọn.
     *
     * <p>{@code keyword} so khớp (không phân biệt hoa thường) với chuỗi điểm đến.
     * Kết quả luôn yêu cầu có ít nhất một ngày khởi hành {@code >= departureFromDate}.
     */
    public static Specification<Tour> publishedWithFilters(
            String keyword,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            Integer minDurationDays,
            Integer maxDurationDays,
            Long destinationId,
            String departurePoint,
            LocalDate departureFromDate) {

        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("status"), TourStatus.published));
            query.distinct(true);

            if (keyword != null && !keyword.isBlank()) {
                String p = "%" + keyword.trim().toLowerCase() + "%";
                predicates.add(
                        cb.like(
                                cb.lower(cb.coalesce(root.get("destinationList"), cb.literal(""))),
                                p));
            }

            if (minPrice != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("basePrice"), minPrice));
            }
            if (maxPrice != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("basePrice"), maxPrice));
            }
            if (minDurationDays != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("durationDays"), minDurationDays));
            }
            if (maxDurationDays != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("durationDays"), maxDurationDays));
            }
            if (destinationId != null) {
                Join<Tour, TourDestination> td = root.join("tourDestinations");
                predicates.add(cb.equal(td.get("destination").get("id"), destinationId));
            }
            if (departurePoint != null && !departurePoint.isBlank()) {
                String p = "%" + departurePoint.trim().toLowerCase() + "%";
                predicates.add(cb.like(cb.lower(cb.coalesce(root.get("departurePoint"), cb.literal(""))), p));
            }
            if (departureFromDate != null) {
                Join<Tour, TourDeparture> td = root.join("tourDepartures");
                predicates.add(cb.greaterThanOrEqualTo(td.get("departureDate"), departureFromDate));
            }

            return cb.and(predicates.toArray(Predicate[]::new));
        };
    }
}
