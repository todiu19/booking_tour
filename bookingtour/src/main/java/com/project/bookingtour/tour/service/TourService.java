package com.project.bookingtour.tour.service;

import com.project.bookingtour.common.dto.request.TourCreateRequest;
import com.project.bookingtour.common.dto.request.TourItineraryHotelRequest;
import com.project.bookingtour.common.dto.request.TourItineraryRequest;
import com.project.bookingtour.common.dto.request.TourUpdateRequest;
import com.project.bookingtour.common.dto.response.PageResponse;
import com.project.bookingtour.common.dto.response.TourResponse;
import com.project.bookingtour.common.enums.ReviewStatus;
import com.project.bookingtour.common.enums.TourStatus;
import com.project.bookingtour.common.exception.AppException;
import com.project.bookingtour.common.exception.ErrorCode;
import com.project.bookingtour.domain.entity.Destination;
import com.project.bookingtour.domain.entity.Hotel;
import com.project.bookingtour.domain.entity.Tour;
import com.project.bookingtour.domain.entity.TourDestination;
import com.project.bookingtour.domain.entity.TourDestinationId;
import com.project.bookingtour.domain.entity.TourDeparture;
import com.project.bookingtour.domain.entity.TourImage;
import com.project.bookingtour.domain.entity.TourItinerary;
import com.project.bookingtour.domain.entity.TourItineraryHotel;
import com.project.bookingtour.domain.repository.TourDepartureRepository;
import com.project.bookingtour.domain.repository.DestinationRepository;
import com.project.bookingtour.domain.repository.HotelRepository;
import com.project.bookingtour.domain.repository.ReviewRepository;
import com.project.bookingtour.domain.repository.TourImageRepository;
import com.project.bookingtour.domain.repository.TourItineraryRepository;
import com.project.bookingtour.domain.repository.TourRepository;
import com.project.bookingtour.domain.repository.TourDestinationRepository;
import com.project.bookingtour.domain.repository.TourSpecifications;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.text.Normalizer;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.LinkedHashMap;
import java.util.Set;
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

    private final TourRepository tourRepository;
    private final DestinationRepository destinationRepository;
    private final TourDestinationRepository tourDestinationRepository;
    private final TourDepartureRepository tourDepartureRepository;
    private final TourImageRepository tourImageRepository;
    private final TourItineraryRepository tourItineraryRepository;
    private final HotelRepository hotelRepository;
    private final ReviewRepository reviewRepository;
    private final ObjectMapper objectMapper;

    public List<TourResponse> getPublishedLatest(int limit) {
        return tourRepository
                .findByStatus(
                        TourStatus.published,
                        PageRequest.of(0, limit, Sort.by("createdAt").descending()))
                .map(this::toResponse)
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
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public TourResponse getTour(Long id) {
        return tourRepository
                .findDetailById(id)
                .map(this::toResponse)
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
    public List<TourResponse> listPublishedTours(
            String keyword,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            Integer minDurationDays,
            Integer maxDurationDays,
            Long destinationId,
            String departurePoint,
            String sortBy) {
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
        List<Tour> result =
                tourRepository.findAll(
                        TourSpecifications.publishedWithFilters(
                                null,
                                minPrice,
                                maxPrice,
                                minDurationDays,
                                maxDurationDays,
                                destinationId,
                                departurePoint,
                                LocalDate.now()),
                        Sort.by(Sort.Direction.DESC, "id"));
        LocalDate today = LocalDate.now();
        Map<Long, Integer> ratingOrder = buildPublishedRatingOrder();
        String normalizedKeyword = normalizeForSearch(keyword);
        List<TourResponse> responses =
                result.stream()
                .filter(t -> matchesTourKeyword(t, normalizedKeyword))
                .sorted(buildPublishedTourComparator(sortBy, today, ratingOrder))
                .map(this::toResponse)
                .toList();
        enrichRatingStats(responses);
        return responses;
    }

    private Comparator<Tour> buildPublishedTourComparator(
            String sortBy, LocalDate today, Map<Long, Integer> ratingOrder) {
        String mode = sortBy == null ? "" : sortBy.trim().toLowerCase(Locale.ROOT);
        return switch (mode) {
            case "price_asc", "priceasc", "low_to_high" -> Comparator
                    .comparing(Tour::getBasePrice, Comparator.nullsLast(BigDecimal::compareTo))
                    .thenComparing(Tour::getId, Comparator.reverseOrder());
            case "price_desc", "pricedesc", "high_to_low" -> Comparator
                    .comparing(Tour::getBasePrice, Comparator.nullsLast(BigDecimal::compareTo))
                    .reversed()
                    .thenComparing(Tour::getId, Comparator.reverseOrder());
            case "departure_date", "departure", "departure_date_asc" -> Comparator
                    .comparing((Tour t) -> earliestDepartureOnOrAfter(t, today), Comparator.nullsLast(LocalDate::compareTo))
                    .thenComparing(Tour::getId, Comparator.reverseOrder());
            case "rating_desc", "rating", "review" -> Comparator
                    .comparingInt((Tour t) -> ratingOrder.getOrDefault(t.getId(), Integer.MAX_VALUE))
                    .thenComparing(Tour::getId, Comparator.reverseOrder());
            default -> Comparator.comparing(Tour::getId, Comparator.reverseOrder());
        };
    }

    private boolean matchesTourKeyword(Tour tour, String normalizedKeyword) {
        if (normalizedKeyword == null || normalizedKeyword.isBlank()) {
            return true;
        }
        return normalizeForSearch(tour == null ? null : tour.getDestinationList()).contains(normalizedKeyword);
    }

    private String normalizeForSearch(String value) {
        if (value == null || value.isBlank()) {
            return "";
        }
        String normalized = Normalizer.normalize(value, Normalizer.Form.NFD);
        return normalized.replaceAll("\\p{M}+", "").toLowerCase(Locale.ROOT);
    }

    private Map<Long, Integer> buildPublishedRatingOrder() {
        List<Long> ids = tourRepository.findPublishedIdsOrderByAvgRating();
        Map<Long, Integer> order = new LinkedHashMap<>();
        for (int i = 0; i < ids.size(); i++) {
            order.put(ids.get(i), i);
        }
        return order;
    }

    private void enrichRatingStats(List<TourResponse> tours) {
        if (tours == null || tours.isEmpty()) {
            return;
        }
        List<Long> tourIds = tours.stream().map(TourResponse::getId).filter(Objects::nonNull).distinct().toList();
        if (tourIds.isEmpty()) {
            return;
        }
        List<Object[]> raw = reviewRepository.aggregateRatingByTourIds(tourIds, ReviewStatus.visible);
        Map<Long, Double> avgByTour = new HashMap<>();
        Map<Long, Long> countByTour = new HashMap<>();
        for (Object[] row : raw) {
            if (row == null || row.length < 3 || row[0] == null) {
                continue;
            }
            Long tourId = ((Number) row[0]).longValue();
            Double avg = row[1] == null ? 0d : ((Number) row[1]).doubleValue();
            Long count = row[2] == null ? 0L : ((Number) row[2]).longValue();
            avgByTour.put(tourId, avg);
            countByTour.put(tourId, count);
        }
        for (TourResponse tour : tours) {
            Long id = tour.getId();
            if (id == null) {
                tour.setAverageRating(0d);
                tour.setReviewCount(0L);
                continue;
            }
            tour.setAverageRating(avgByTour.getOrDefault(id, 0d));
            tour.setReviewCount(countByTour.getOrDefault(id, 0L));
        }
    }

    private LocalDate earliestDepartureOnOrAfter(Tour tour, LocalDate threshold) {
        if (tour == null || tour.getTourDepartures() == null || threshold == null) {
            return null;
        }
        return tour.getTourDepartures().stream()
                .map(TourDeparture::getDepartureDate)
                .filter(Objects::nonNull)
                .filter(d -> !d.isBefore(threshold))
                .min(LocalDate::compareTo)
                .orElse(null);
    }

    /** Admin: mọi trạng thái. */
    @Transactional(readOnly = true)
    public PageResponse<TourResponse> listTours(int page, int size) {
        PageRequest pr = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "id"));
        Page<Tour> result = tourRepository.findAll(pr);
        return PageResponse.fromPage(result.map(this::toResponse));
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
        List<LocalDate> departureDates = normalizeDepartureDates(req.getDepartureDates());
        tour.setBasePrice(req.getBasePrice() != null ? req.getBasePrice() : BigDecimal.ZERO);
        tour.setDestinationList(normalizeDestinationListJson(req.getDestinationList()));
        if (req.getDeparturePoint() != null) {
            tour.setDeparturePoint(normalizeDeparturePoint(req.getDeparturePoint()));
        }
        tour.setStatus(req.getStatus() != null ? req.getStatus() : TourStatus.published);
        validateTourNamePrefix(tour.getName(), tour.getDeparturePoint());
        validateTourNameDoesNotRepeatDeparture(tour.getName(), tour.getDeparturePoint());
        Tour saved = tourRepository.save(tour);
        syncDepartures(saved, departureDates);
        if (req.getDestinationIds() != null) {
            syncDestinations(saved, req.getDestinationIds());
        }
        if (req.getItineraries() != null) {
            syncItineraries(saved, req.getItineraries());
        }
        addTourImageUrls(saved, req.getImageUrls());
        return getTour(saved.getId());
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
        if (req.getDepartureDates() != null) {
            List<LocalDate> departureDates = normalizeDepartureDates(req.getDepartureDates());
            syncDepartures(tour, departureDates);
        }
        if (req.getBasePrice() != null) {
            tour.setBasePrice(req.getBasePrice());
        }
        if (req.getDestinationIds() != null) {
            syncDestinations(tour, req.getDestinationIds());
        } else if (req.getDestinationList() != null) {
            syncDestinations(tour, req.getDestinationList());
        }
        if (req.getDeparturePoint() != null) {
            tour.setDeparturePoint(normalizeDeparturePoint(req.getDeparturePoint()));
        }
        if (req.getStatus() != null) {
            tour.setStatus(req.getStatus());
        }
        validateTourNamePrefix(tour.getName(), tour.getDeparturePoint());
        validateTourNameDoesNotRepeatDeparture(tour.getName(), tour.getDeparturePoint());
        Tour saved = tourRepository.save(tour);
        if (req.getItineraries() != null) {
            syncItineraries(saved, req.getItineraries());
        }
        addTourImageUrls(saved, req.getImageUrls());
        return getTour(saved.getId());
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

    @Transactional
    public void publishTour(Long id) {
        Tour tour =
                tourRepository
                        .findById(id)
                        .orElseThrow(() -> new AppException(ErrorCode.TOUR_NOT_FOUND));
        tour.setStatus(TourStatus.published);
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

        List<String> destinationNames =
                cleanedIds.stream()
                        .map(byId::get)
                        .filter(Objects::nonNull)
                        .map(Destination::getName)
                        .toList();
        tour.setDestinationList(toJsonArray(destinationNames));
    }

    private String normalizeDestinationListJson(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        String trimmed = raw.trim();
        if (trimmed.startsWith("[")) {
            return trimmed;
        }
        List<String> names =
                Arrays.stream(trimmed.split(","))
                        .map(String::trim)
                        .filter(s -> !s.isEmpty())
                        .toList();
        return toJsonArray(names);
    }

    private String toJsonArray(List<String> values) {
        try {
            return objectMapper.writeValueAsString(values == null ? List.of() : values);
        } catch (JsonProcessingException e) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Invalid destination list format");
        }
    }

    private void addTourImageUrls(Tour tour, List<String> imageUrls) {
        if (imageUrls == null || imageUrls.isEmpty()) {
            return;
        }
        List<TourImage> existing = tourImageRepository.findByTour_IdOrderByDisplayOrderAsc(tour.getId());
        int nextDisplayOrder =
                existing.isEmpty()
                        ? 1
                        : existing.get(existing.size() - 1).getDisplayOrder() + 1;
        for (String raw : imageUrls) {
            String url = raw == null ? "" : raw.trim();
            if (url.isEmpty()) {
                continue;
            }
            TourImage image = new TourImage();
            image.setTour(tour);
            image.setImageUrl(url);
            image.setDisplayOrder(nextDisplayOrder++);
            tourImageRepository.save(image);
        }
    }

    private String normalizeDeparturePoint(String raw) {
        if (raw == null) {
            return null;
        }
        String value = raw.trim();
        if (value.isEmpty()) {
            return null;
        }
        String lowered = value.toLowerCase(Locale.ROOT);
        if (lowered.equals("ha noi") || lowered.equals("hà nội") || lowered.equals("hn")) {
            return "Hà Nội";
        }
        if (lowered.equals("da nang") || lowered.equals("đà nẵng") || lowered.equals("dn")) {
            return "Đà Nẵng";
        }
        if (lowered.equals("tp hcm")
                || lowered.equals("tphcm")
                || lowered.equals("tp.hcm")
                || lowered.equals("tp ho chi minh")
                || lowered.equals("tp. ho chi minh")
                || lowered.equals("tp hồ chí minh")
                || lowered.equals("hcm")
                || lowered.equals("sai gon")
                || lowered.equals("sài gòn")) {
            return "TP HCM";
        }
        return value;
    }

    private void validateTourNamePrefix(String tourName, String departurePoint) {
        if (tourName == null || departurePoint == null) {
            return;
        }
        String expected = departurePoint + " - ";
        if (!tourName.startsWith(expected)) {
            throw new AppException(
                    ErrorCode.BAD_REQUEST,
                    "Tour name must start with departure point: " + expected + "...");
        }
    }

    /**
     * Tên tour dạng "Điểm xuất phát - ... - ..." không được lặp cùng một đoạn trùng {@code
     * departurePoint} (ví dụ tránh "Đà Nẵng - đà nẵng - hội an").
     */
    private void validateTourNameDoesNotRepeatDeparture(String tourName, String departurePoint) {
        if (tourName == null || departurePoint == null) {
            return;
        }
        String dp = departurePoint.trim();
        if (dp.length() < 2) {
            return;
        }
        String[] parts = tourName.split("\\s*-\\s*");
        int sameAsDeparture = 0;
        for (String part : parts) {
            if (part == null) {
                continue;
            }
            String t = part.trim();
            if (t.isEmpty()) {
                continue;
            }
            if (t.equalsIgnoreCase(dp)) {
                sameAsDeparture++;
            }
        }
        if (sameAsDeparture > 1) {
            throw new AppException(
                    ErrorCode.BAD_REQUEST,
                    "Tour name must list the departure city only once at the start (e.g. Đà Nẵng - hội an, not Đà Nẵng - đà nẵng - hội an)");
        }
    }

    private void syncDepartures(Tour tour, List<LocalDate> departureDates) {
        tourDepartureRepository.deleteByTour_Id(tour.getId());
        if (departureDates == null || departureDates.isEmpty()) {
            return;
        }
        for (LocalDate departureDate : departureDates) {
            TourDeparture departure = new TourDeparture();
            departure.setTour(tour);
            departure.setDepartureDate(departureDate);
            tourDepartureRepository.save(departure);
        }
    }

    private List<LocalDate> normalizeDepartureDates(List<LocalDate> dates) {
        if (dates == null) {
            return List.of();
        }
        return dates.stream().filter(Objects::nonNull).distinct().sorted().toList();
    }

    private TourResponse toResponse(Tour tour) {
        List<LocalDate> departureDates =
                tourDepartureRepository.findByTour_IdOrderByDepartureDateAsc(tour.getId()).stream()
                        .map(TourDeparture::getDepartureDate)
                        .filter(Objects::nonNull)
                        .toList();
        return TourResponse.from(tour, departureDates);
    }

    private void syncItineraries(Tour tour, List<TourItineraryRequest> itineraries) {
        tourItineraryRepository.deleteByTour_Id(tour.getId());
        if (itineraries == null || itineraries.isEmpty()) {
            return;
        }
        List<TourItineraryRequest> sorted =
                itineraries.stream()
                        .filter(Objects::nonNull)
                        .sorted(Comparator.comparing(i -> i.getDayNumber() == null ? Integer.MAX_VALUE : i.getDayNumber()))
                        .toList();
        for (TourItineraryRequest req : sorted) {
            if (req.getDayNumber() == null) {
                throw new AppException(ErrorCode.BAD_REQUEST, "itinerary dayNumber is required");
            }
            if (req.getTitle() == null || req.getTitle().isBlank()) {
                throw new AppException(ErrorCode.BAD_REQUEST, "itinerary title is required");
            }
            TourItinerary itinerary = new TourItinerary();
            itinerary.setTour(tour);
            itinerary.setDayNumber(req.getDayNumber());
            itinerary.setTitle(req.getTitle().trim());
            itinerary.setDescription(req.getDescription());
            if (req.getHotels() != null) {
                itinerary.setItineraryHotels(buildItineraryHotels(itinerary, req.getHotels()));
            }
            tourItineraryRepository.save(itinerary);
        }
    }

    private Set<TourItineraryHotel> buildItineraryHotels(
            TourItinerary itinerary, List<TourItineraryHotelRequest> hotelRequests) {
        List<Long> hotelIds =
                hotelRequests.stream()
                        .filter(Objects::nonNull)
                        .map(TourItineraryHotelRequest::getHotelId)
                        .filter(Objects::nonNull)
                        .distinct()
                        .toList();
        Map<Long, Hotel> hotelsById =
                hotelIds.isEmpty()
                        ? Map.of()
                        : hotelRepository.findAllById(hotelIds).stream()
                                .collect(Collectors.toMap(Hotel::getId, h -> h));
        if (hotelsById.size() != hotelIds.size()) {
            throw new AppException(ErrorCode.BAD_REQUEST, "One or more hotelIds do not exist");
        }
        return hotelRequests.stream()
                .filter(Objects::nonNull)
                .map(
                        req -> {
                            if (req.getHotelId() == null) {
                                throw new AppException(ErrorCode.BAD_REQUEST, "hotelId is required");
                            }
                            Hotel hotel = hotelsById.get(req.getHotelId());
                            if (hotel == null) {
                                throw new AppException(ErrorCode.BAD_REQUEST, "Invalid hotelId: " + req.getHotelId());
                            }
                            TourItineraryHotel item = new TourItineraryHotel();
                            item.setItinerary(itinerary);
                            item.setHotel(hotel);
                            item.setNightCount(req.getNightCount());
                            return item;
                        })
                .collect(Collectors.toCollection(LinkedHashSet::new));
    }
}
