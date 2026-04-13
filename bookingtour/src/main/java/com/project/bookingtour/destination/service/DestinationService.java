package com.project.bookingtour.destination.service;

import com.project.bookingtour.common.dto.request.DestinationCreateRequest;
import com.project.bookingtour.common.dto.response.TourResponse;
import com.project.bookingtour.common.exception.AppException;
import com.project.bookingtour.common.exception.ErrorCode;
import com.project.bookingtour.common.dto.request.DestinationUpdateRequest;
import com.project.bookingtour.common.dto.response.DestinationResponse;
import com.project.bookingtour.common.dto.response.PageResponse;
import com.project.bookingtour.common.enums.TourStatus;
import com.project.bookingtour.domain.entity.Destination;
import com.project.bookingtour.domain.repository.DestinationRepository;
import com.project.bookingtour.domain.repository.DestinationSpecifications;
import com.project.bookingtour.domain.repository.TourRepository;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class DestinationService {

    private static final int MAX_CATALOG_PAGE_SIZE = 100;

    private final DestinationRepository destinationRepository;
    private final TourRepository tourRepository;

    /**
     * Danh sách điểm đến phân trang. Không truyền tiêu chí → tất cả bản ghi. Có {@code keyword}
     * và/hoặc {@code province} / {@code country} → lọc (không phân biệt hoa thường).
     */
    @Transactional(readOnly = true)
    public PageResponse<DestinationResponse> searchDestinations(
            int page,
            int size,
            String keyword,
            String province,
            String country) {
        int safeSize = Math.min(Math.max(size, 1), MAX_CATALOG_PAGE_SIZE);
        PageRequest pr =
                PageRequest.of(Math.max(page, 0), safeSize, Sort.by(Sort.Direction.DESC, "id"));

        boolean noFilters =
                (keyword == null || keyword.isBlank())
                        && (province == null || province.isBlank())
                        && (country == null || country.isBlank());

        Page<Destination> result =
                noFilters
                        ? destinationRepository.findAll(pr)
                        : destinationRepository.findAll(
                                DestinationSpecifications.withFilters(keyword, province, country), pr);
        return PageResponse.fromPage(result.map(DestinationResponse::from));
    }

    @Transactional
    public DestinationResponse createDestination(DestinationCreateRequest req) {
        if (req.getName() == null || req.getName().isBlank()) {
            throw new AppException(ErrorCode.BAD_REQUEST, "name is required");
        }
        String name = req.getName().trim();
        String province = normalizeOptional(req.getProvince());
        String country = normalizeCountry(req.getCountry());
        if (destinationRepository.existsByNameAndProvinceAndCountry(name, province, country)) {
            throw new AppException(ErrorCode.DESTINATION_ALREADY_EXISTS);
        }
        Destination d = new Destination();
        d.setName(name);
        d.setProvince(province);
        d.setCountry(country);
        d.setImageUrl(normalizeOptional(req.getImageUrl()));
        return DestinationResponse.from(destinationRepository.save(d));
    }

    @Transactional
    public DestinationResponse updateDestination(Long id, DestinationUpdateRequest req) {
        Destination d =
                destinationRepository
                        .findById(id)
                        .orElseThrow(() -> new AppException(ErrorCode.DESTINATION_NOT_FOUND));
        String name = d.getName();
        String province = d.getProvince();
        String country = d.getCountry();
        if (req.getName() != null) {
            if (req.getName().isBlank()) {
                throw new AppException(ErrorCode.BAD_REQUEST, "name cannot be blank");
            }
            name = req.getName().trim();
        }
        if (req.getProvince() != null) {
            province = normalizeOptional(req.getProvince());
        }
        if (req.getCountry() != null) {
            country = normalizeCountry(req.getCountry());
        }
        if (destinationRepository.existsByNameAndProvinceAndCountryAndIdNot(
                name, province, country, id)) {
            throw new AppException(ErrorCode.DESTINATION_ALREADY_EXISTS);
        }
        d.setName(name);
        d.setProvince(province);
        d.setCountry(country);
        if (req.getImageUrl() != null) {
            d.setImageUrl(normalizeOptional(req.getImageUrl()));
        }
        return DestinationResponse.from(destinationRepository.save(d));
    }

    private static String normalizeOptional(String s) {
        if (s == null || s.isBlank()) {
            return null;
        }
        return s.trim();
    }

    /** Schema default country; empty string treated as default for uniqueness consistency. */
    private static String normalizeCountry(String s) {
        String n = normalizeOptional(s);
        return n != null ? n : "Viet Nam";
    }

    @Transactional(readOnly = true)
    public List<DestinationResponse> getTopDestinations(int limit) {
        List<Long> ids = destinationRepository.findIdsOrderByBookingCount(limit);
        if (ids.isEmpty()) {
            return List.of();
        }
        Map<Long, Destination> byId =
                destinationRepository.findAllById(ids).stream()
                        .collect(Collectors.toMap(Destination::getId, d -> d));
        return ids.stream()
                .map(byId::get)
                .filter(Objects::nonNull)
                .map(DestinationResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public DestinationResponse getDestination(Long id) {
        Destination destination =
                destinationRepository
                        .findById(id)
                        .orElseThrow(() -> new AppException(ErrorCode.DESTINATION_NOT_FOUND));
        return DestinationResponse.from(destination);
    }

    @Transactional(readOnly = true)
    public PageResponse<TourResponse> getPublishedToursByDestination(Long destinationId, int page, int size) {
        if (!destinationRepository.existsById(destinationId)) {
            throw new AppException(ErrorCode.DESTINATION_NOT_FOUND);
        }
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), MAX_CATALOG_PAGE_SIZE);
        PageRequest pageable =
                PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.DESC, "id"));
        Page<TourResponse> mapped =
                tourRepository
                        .findPublishedByDestinationId(destinationId, TourStatus.published, pageable)
                        .map(TourResponse::from);
        return PageResponse.fromPage(mapped);
    }
}

