// src/main/java/ro/atm/backend/dto/LocationDetailsDTO.java
package ro.atm.backend.domain.activity.dto;

import lombok.*;
import ro.atm.backend.domain.activity.entity.LocationDetails;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class LocationDetailsDTO {
    private String address;
    private String city;
    private Double latitude;
    private Double longitude;
    private String postalCode;

    public static LocationDetailsDTO fromEntity(LocationDetails locationDetails) {
        if (locationDetails == null) {
            return null;
        }
        return LocationDetailsDTO.builder()
                .address(locationDetails.getAddress())
                .city(locationDetails.getCity())
                .latitude(locationDetails.getLatitude())
                .longitude(locationDetails.getLongitude())
                .postalCode(locationDetails.getPostalCode())
                .build();
    }

    public LocationDetails toEntity() {
        return LocationDetails.builder()
                .address(this.address)
                .city(this.city)
                .latitude(this.latitude)
                .longitude(this.longitude)
                .postalCode(this.postalCode)
                .build();
    }
}