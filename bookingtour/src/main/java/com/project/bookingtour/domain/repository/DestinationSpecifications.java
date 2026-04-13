package com.project.bookingtour.domain.repository;

import com.project.bookingtour.domain.entity.Destination;
import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;
import org.springframework.data.jpa.domain.Specification;

public final class DestinationSpecifications {

    private DestinationSpecifications() {}

    /**
     * {@code keyword}: tìm trong tên, tỉnh/thành, quốc gia (OR). {@code province} / {@code country}:
     * lọc thêm chuỗi con trong từng cột (AND với nhau và với keyword nếu có).
     */
    public static Specification<Destination> withFilters(
            String keyword, String provinceContains, String countryContains) {

        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (keyword != null && !keyword.isBlank()) {
                String p = "%" + keyword.trim().toLowerCase() + "%";
                List<Predicate> ors = new ArrayList<>();
                ors.add(cb.like(cb.lower(root.get("name")), p));
                ors.add(
                        cb.like(
                                cb.lower(cb.coalesce(root.get("province"), cb.literal(""))),
                                p));
                ors.add(
                        cb.like(
                                cb.lower(cb.coalesce(root.get("country"), cb.literal(""))),
                                p));
                predicates.add(cb.or(ors.toArray(Predicate[]::new)));
            }
            if (provinceContains != null && !provinceContains.isBlank()) {
                String p = "%" + provinceContains.trim().toLowerCase() + "%";
                predicates.add(
                        cb.like(
                                cb.lower(cb.coalesce(root.get("province"), cb.literal(""))),
                                p));
            }
            if (countryContains != null && !countryContains.isBlank()) {
                String p = "%" + countryContains.trim().toLowerCase() + "%";
                predicates.add(
                        cb.like(
                                cb.lower(cb.coalesce(root.get("country"), cb.literal(""))),
                                p));
            }

            if (predicates.isEmpty()) {
                return cb.conjunction();
            }
            return cb.and(predicates.toArray(Predicate[]::new));
        };
    }
}
