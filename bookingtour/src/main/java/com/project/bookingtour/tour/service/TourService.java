package com.project.bookingtour.tour.service;

import com.project.bookingtour.common.dto.request.TourCreateRequest;
import com.project.bookingtour.common.dto.request.TourUpdateRequest;
import com.project.bookingtour.common.dto.response.PageResponse;
import com.project.bookingtour.common.dto.response.TourResponse;
import com.project.bookingtour.common.enums.TourStatus;
import com.project.bookingtour.common.exception.AppException;
import com.project.bookingtour.common.exception.ErrorCode;
import com.project.bookingtour.domain.entity.Destination;
import com.project.bookingtour.domain.entity.Tour;
import com.project.bookingtour.domain.entity.TourDestination;
import com.project.bookingtour.domain.entity.TourDestinationId;
import com.project.bookingtour.domain.repository.DestinationRepository;
import com.project.bookingtour.domain.repository.TourRepository;
import com.project.bookingtour.domain.repository.TourDestinationRepository;
import com.project.bookingtour.domain.repository.TourSpecifications;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.LinkedHashMap;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class TourService {

    private static final int MAX_CATALOG_PAGE_SIZE = 100;

    private final TourRepository tourRepository;
    private final DestinationRepository destinationRepository;
    private final TourDestinationRepository tourDestinationRepository;

    public List<TourResponse> getPublishedLatest(int limit) {
        return tourRepository
                .findByStatus(
                        TourStatus.published,
                        PageRequest.of(0, limit, Sort.by("createdAt").descending()))
                .map(TourResponse::from)
                .getContent();
    }

    /**
     * Nổi bật: kết hợp (1) điểm trung bình review {@code visible}, (2) số booking không bị {@code
     * cancelled}. Tour chưa có review được coi avg = 0; chưa có booking thì count = 0.
     */
    public List<TourResponse> getPublishedFeatured(int limit) {
        List<Long> ids = tourRepository.findPublishedIdsOrderByAvgRatingAndBookingCount(limit);
        if (ids.isEmpty()) {
            return List.of();
        }
        Map<Long, Tour> byId =
                tourRepository.findAllById(ids).stream()
                        .collect(Collectors.toMap(Tour::getId, t -> t));
        return ids.stream()
                .map(byId::get)
                .filter(Objects::nonNull)
                .map(TourResponse::from)
                .toList();
    }

    public TourResponse getTour(Long id) {
        return tourRepository
                .findById(id)
                .map(TourResponse::from)
                .orElseThrow(() -> new AppException(ErrorCode.TOUR_NOT_FOUND));
    }

    /**
     * Catalog công khai: chỉ {@link TourStatus#published}.
     *
     * <p>Không truyền tiêu chí lọc (hoặc toàn bỏ trống) → trả về <strong>tất cả</strong> tour đã
     * xuất bản, phân trang theo {@code page}/{@code size}. Có tiêu chí → lọc thêm bằng
     * {@link TourSpecifications}.
     */
    @Transactional(readOnly = true)
    public PageResponse<TourResponse> listPublishedTours(
            int page,
            int size,
            String keyword,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            Integer minDurationDays,
            Integer maxDurationDays,
            String departureContains,
            Long destinationId) {
        int safeSize = Math.min(Math.max(size, 1), MAX_CATALOG_PAGE_SIZE);
        if (minPrice != null
                && maxPrice != null
                && minPrice.compareTo(maxPrice) > 0) {
            throw new AppException(
                    ErrorCode.BAD_REQUEST, "minPrice must be less than or equal to maxPrice");
        }
        if (minDurationDays != null
                && maxDurationDays != null
                && minDurationDays > maxDurationDays) {
            throw new AppException(
                    ErrorCode.BAD_REQUEST,
                    "minDurationDays must be less than or equal to maxDurationDays");
        }
        PageRequest pr = PageRequest.of(Math.max(page, 0), safeSize, Sort.by(Sort.Direction.DESC, "id"));

        boolean noFilters =
                (keyword == null || keyword.isBlank())
                        && minPrice == null
                        && maxPrice == null
                        && minDurationDays == null
                        && maxDurationDays == null
                        && (departureContains == null || departureContains.isBlank())
                        && destinationId == null;

        Page<Tour> result =
                noFilters
                        ? tourRepository.findByStatus(TourStatus.published, pr)
                        : tourRepository.findAll(
                                TourSpecifications.publishedWithFilters(
                                        keyword,
                                        minPrice,
                                        maxPrice,
                                        minDurationDays,
                                        maxDurationDays,
                                        departureContains,
                                        destinationId),
                                pr);
        return PageResponse.fromPage(result.map(TourResponse::from));
    }

    /** Admin: mọi trạng thái. */
    @Transactional(readOnly = true)
    public PageResponse<TourResponse> listTours(int page, int size) {
        PageRequest pr = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "id"));
        Page<Tour> result = tourRepository.findAll(pr);
        return PageResponse.fromPage(result.map(TourResponse::from));
    }

    @Transactional
    public TourResponse createTour(TourCreateRequest req) {
        if (req.getCode() == null || req.getCode().isBlank()) {
            throw new AppException(ErrorCode.BAD_REQUEST, "code is required");
        }
        if (req.getName() == null || req.getName().isBlank()) {
            throw new AppException(ErrorCode.BAD_REQUEST, "name is required");
        }
        if (tourRepository.existsByCode(req.getCode().trim())) {
            throw new AppException(ErrorCode.TOUR_CODE_ALREADY_EXISTS);
        }
        Tour tour = new Tour();
        tour.setCode(req.getCode().trim());
        tour.setName(req.getName().trim());
        tour.setDescription(req.getDescription());
        tour.setDurationDays(req.getDurationDays() != null ? req.getDurationDays() : 1);
        tour.setDepartureLocation(req.getDepartureLocation());
        tour.setBasePrice(req.getBasePrice() != null ? req.getBasePrice() : BigDecimal.ZERO);
        tour.setDestinationList(req.getDestinationList());
        tour.setStatus(req.getStatus() != null ? req.getStatus() : TourStatus.published);
        Tour saved = tourRepository.save(tour);
        if (req.getDestinationIds() != null) {
            syncDestinations(saved, req.getDestinationIds());
        }
        return TourResponse.from(saved);
    }

    @Transactional
    public TourResponse updateTour(Long id, TourUpdateRequest req) {
        Tour tour =
                tourRepository
                        .findById(id)
                        .orElseThrow(() -> new AppException(ErrorCode.TOUR_NOT_FOUND));
        if (req.getCode() != null && !req.getCode().isBlank()) {
            String c = req.getCode().trim();
            if (tourRepository.existsByCodeAndIdNot(c, id)) {
                throw new AppException(ErrorCode.TOUR_CODE_ALREADY_EXISTS);
            }
            tour.setCode(c);
        }
        if (req.getName() != null) {
            if (req.getName().isBlank()) {
                throw new AppException(ErrorCode.BAD_REQUEST, "name cannot be blank");
            }
            tour.setName(req.getName().trim());
        }
        if (req.getDescription() != null) {
            tour.setDescription(req.getDescription());
        }
        if (req.getDurationDays() != null) {
            tour.setDurationDays(req.getDurationDays());
        }
        if (req.getDepartureLocation() != null) {
            tour.setDepartureLocation(req.getDepartureLocation());
        }
        if (req.getBasePrice() != null) {
            tour.setBasePrice(req.getBasePrice());
        }
        if (req.getDestinationIds() != null) {
            syncDestinations(tour, req.getDestinationIds());
        } else if (req.getDestinationList() != null) {
            tour.setDestinationList(req.getDestinationList());
        }
        if (req.getStatus() != null) {
            tour.setStatus(req.getStatus());
        }
        return TourResponse.from(tourRepository.save(tour));
    }

    /** Gỡ tour khỏi catalog: đặt {@link TourStatus#archived}, không xóa bản ghi (giữ FK/lịch sử). */
    @Transactional
    public void deleteTour(Long id) {
        Tour tour =
                tourRepository
                        .findById(id)
                        .orElseThrow(() -> new AppException(ErrorCode.TOUR_NOT_FOUND));
        tour.setStatus(TourStatus.archived);
        tourRepository.save(tour);
    }

    private void syncDestinations(Tour tour, List<Long> destinationIds) {
        List<Long> cleanedIds =
                destinationIds == null
                        ? List.of()
                        : destinationIds.stream().filter(Objects::nonNull).distinct().toList();

        tourDestinationRepository.deleteByTour_Id(tour.getId());
        if (cleanedIds.isEmpty()) {
            tour.setDestinationList(null);
            return;
        }

        List<Destination> destinations = destinationRepository.findAllById(cleanedIds);
        if (destinations.size() != cleanedIds.size()) {
            throw new AppException(
                    ErrorCode.DESTINATION_NOT_FOUND, "One or more destinationIds do not exist");
        }

        Map<Long, Destination> byId =
                destinations.stream()
                        .collect(Collectors.toMap(Destination::getId, d -> d, (a, b) -> a, LinkedHashMap::new));

        int idx = 1;
        for (Long destinationId : cleanedIds) {
            Destination destination = byId.get(destinationId);
            TourDestination td = new TourDestination();
            td.setId(new TourDestinationId(tour.getId(), destinationId));
            td.setTour(tour);
            td.setDestination(destination);
            td.setDayNumber(idx++);
            tourDestinationRepository.save(td);
        }

        String destinationList =
                cleanedIds.stream()
                        .map(byId::get)
                        .filter(Objects::nonNull)
                        .map(Destination::getName)
                        .collect(Collectors.joining(", "));
        tour.setDestinationList(destinationList);
    }
}
