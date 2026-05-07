package com.project.bookingtour.hotel.service;

import com.project.bookingtour.common.dto.response.HotelResponse;
import com.project.bookingtour.common.enums.HotelStatus;
import com.project.bookingtour.common.exception.AppException;
import com.project.bookingtour.common.exception.ErrorCode;
import com.project.bookingtour.domain.entity.Hotel;
import com.project.bookingtour.domain.repository.HotelRepository;
import com.project.bookingtour.domain.repository.HotelTypeRepository;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.math.BigDecimal;
import java.util.Arrays;
import java.text.Normalizer;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class HotelService {

    private final HotelRepository hotelRepository;
    private final HotelTypeRepository hotelTypeRepository;

    @Transactional(readOnly = true)
    public List<String> listHotelTypes() {
        return hotelTypeRepository.findAll(Sort.by(Sort.Direction.ASC, "name")).stream()
                .map(type -> type.getName() == null ? "" : type.getName().trim())
                .filter(name -> !name.isBlank())
                .distinct()
                .toList();
    }

    @Transactional(readOnly = true)
    public List<HotelResponse> listHotels(
            String keyword,
            String name,
            String location,
            String destination,
            String hotelType,
            Double minRating,
            Double minStars,
            Double maxStars,
            Integer roomCapacity,
            Long destinationId,
            String sortBy) {
        String normalizedKeyword = keyword == null ? "" : keyword.trim().toLowerCase(Locale.ROOT);
        String normalizedName = normalize(name);
        String normalizedLocation = normalize(location);
        String normalizedDestination = normalize(destination);
        String normalizedHotelType = normalize(hotelType);
        List<Hotel> source =
                destinationId == null
                        ? hotelRepository.findAllByStatus(HotelStatus.active)
                        : hotelRepository.findAllByDestination_IdAndStatus(destinationId, HotelStatus.active);
        List<HotelResponse> hotels =
                source.stream()
                        .map(HotelResponse::from)
                        .filter(h -> matchKeyword(h, normalizedKeyword))
                        .filter(h -> containsIgnoreCase(h.getName(), normalizedName))
                        .filter(h -> containsIgnoreCase(h.getLocation(), normalizedLocation))
                        .filter(
                                h ->
                                        containsIgnoreCase(h.getDestinationName(), normalizedDestination)
                                                || containsIgnoreCase(h.getAddress(), normalizedDestination))
                        .filter(h -> containsIgnoreCase(h.getHotelTypeName(), normalizedHotelType))
                        .filter(h -> minRating == null || (h.getAverageRating() != null && h.getAverageRating() >= minRating))
                        .filter(h -> minStars == null || (h.getAverageRating() != null && h.getAverageRating() >= minStars))
                        .filter(h -> maxStars == null || (h.getAverageRating() != null && h.getAverageRating() <= maxStars))
                        .filter(h -> roomCapacity == null || (h.getRoomCapacity() != null && h.getRoomCapacity() >= roomCapacity))
                        .sorted(resolveComparator(sortBy))
                        .toList();
        return hotels;
    }

    @Transactional(readOnly = true)
    public HotelResponse getHotel(Long id) {
        Hotel hotel =
                hotelRepository
                        .findByIdAndStatus(id, HotelStatus.active)
                        .orElseThrow(() -> new AppException(ErrorCode.BAD_REQUEST, "Hotel not found"));
        return HotelResponse.from(hotel);
    }

    private boolean matchKeyword(HotelResponse hotel, String keyword) {
        if (keyword == null || keyword.isBlank()) {
            return true;
        }
        String text =
                String.join(
                                " ",
                                hotel.getName() == null ? "" : hotel.getName(),
                                hotel.getAddress() == null ? "" : hotel.getAddress(),
                                hotel.getLocation() == null ? "" : hotel.getLocation(),
                                hotel.getDestinationName() == null ? "" : hotel.getDestinationName(),
                                hotel.getDescription() == null ? "" : hotel.getDescription())
                        .toLowerCase(Locale.ROOT);
        return normalizeForSearch(text).contains(normalizeForSearch(keyword));
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }

    private boolean containsIgnoreCase(String source, String keyword) {
        if (keyword == null || keyword.isBlank()) {
            return true;
        }
        String normalizedSource = normalizeForSearch(source);
        String normalizedKeyword = normalizeForSearch(keyword);
        if (keyword.contains(",")) {
            return Arrays.stream(normalizedKeyword.split(","))
                    .map(String::trim)
                    .filter(s -> !s.isBlank())
                    .anyMatch(normalizedSource::contains);
        }
        return normalizedSource.contains(normalizedKeyword);
    }

    private String normalizeForSearch(String value) {
        if (value == null || value.isBlank()) {
            return "";
        }
        String normalized = Normalizer.normalize(value, Normalizer.Form.NFD);
        String noAccent = normalized.replaceAll("\\p{M}+", "");
        return noAccent.toLowerCase(Locale.ROOT);
    }

    private Comparator<HotelResponse> resolveComparator(String sortBy) {
        String mode = sortBy == null ? "" : sortBy.trim().toLowerCase(Locale.ROOT);
        Comparator<HotelResponse> byRating =
                Comparator.comparing(
                                HotelResponse::getAverageRating,
                                Comparator.nullsLast(Double::compareTo))
                        .thenComparing(HotelResponse::getReviewCount, Comparator.nullsLast(Long::compareTo));
        Comparator<HotelResponse> byPrice =
                Comparator.comparing(
                        HotelResponse::getBasePrice,
                        Comparator.nullsLast(BigDecimal::compareTo));
        return switch (mode) {
            case "rating_asc" -> byRating;
            case "stars_asc" -> byRating;
            case "stars_desc" -> byRating.reversed();
            case "price_asc" -> byPrice;
            case "price_desc" -> byPrice.reversed();
            case "name_asc" -> Comparator.comparing(
                    h -> h.getName() == null ? "" : h.getName().toLowerCase(Locale.ROOT));
            case "name_desc" -> Comparator.comparing(
                            (HotelResponse h) -> h.getName() == null ? "" : h.getName().toLowerCase(Locale.ROOT))
                    .reversed();
            case "rating_desc", "recommended", "" -> byRating.reversed();
            default -> byRating.reversed();
        };
    }
}
