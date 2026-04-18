package com.project.bookingtour.domain.repository;

import com.project.bookingtour.common.enums.TourStatus;
import com.project.bookingtour.domain.entity.Tour;
import com.project.bookingtour.domain.entity.TourDestination;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import org.springframework.data.jpa.domain.Specification;

public final class TourSpecifications {

    private TourSpecifications() {}

    /**
     * Tour {@link TourStatus#published} với bộ lọc tùy chọn. {@code keyword} so khớp (không phân
     * biệt hoa thường) với tên, mô tả, chuỗi JSON điểm đến.
     */
    public static Specification<Tour> publishedWithFilters(
            String keyword,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            Integer minDurationDays,
            Integer maxDurationDays,
            Long destinationId) {

        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("status"), TourStatus.published));
            query.distinct(true);

            if (keyword != null && !keyword.isBlank()) {
                String p = "%" + keyword.trim().toLowerCase() + "%";
                List<Predicate> ors = new ArrayList<>();
                ors.add(cb.like(cb.lower(root.get("name")), p));
                ors.add(
                        cb.like(
                                cb.lower(cb.coalesce(root.get("description"), cb.literal(""))),
                                p));
                ors.add(
                        cb.like(
                                cb.lower(cb.coalesce(root.get("destinationList"), cb.literal(""))),
                                p));
                predicates.add(cb.or(ors.toArray(Predicate[]::new)));
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

            return cb.and(predicates.toArray(Predicate[]::new));
        };
    }
}
