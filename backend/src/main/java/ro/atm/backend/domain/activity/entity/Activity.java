package ro.atm.backend.domain.activity.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Builder
public class Activity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private Integer minParticipants;

    @Column(nullable = false)
    private Integer maxParticipants;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal pricePerPerson;

    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal depositPercent; // e.g., 20.00 for 20%

    @Column(nullable = false)
    private Integer durationMinutes; // Duration in minutes

    @Column(nullable = false)
    private String location;

    // Optional: More detailed location
    @Embedded
    private LocationDetails locationDetails;

    @ManyToOne
    @JoinColumn(name = "category_id")
    private ActivityCategory category;

    @Column(nullable = false)
    private Boolean active = true;

    @OneToMany(mappedBy = "activity", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Media> mediaList = new ArrayList<>();

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    // Helper methods
    public BigDecimal calculateDeposit() {
        return pricePerPerson.multiply(depositPercent).divide(new BigDecimal("100"));
    }

    public String getFormattedDuration() {
        int hours = durationMinutes / 60;
        int minutes = durationMinutes % 60;

        if (hours > 0 && minutes > 0) {
            return String.format("%dh %dmin", hours, minutes);
        } else if (hours > 0) {
            return String.format("%dh", hours);
        } else {
            return String.format("%dmin", minutes);
        }
    }

    public void addMedia(Media media) {
        mediaList.add(media);
        media.setActivity(this);
    }

    public void removeMedia(Media media) {
        mediaList.remove(media);
        media.setActivity(null);
    }

    public String getLocationIdentifier() {
        if (locationDetails != null &&
                locationDetails.getLatitude() != null &&
                locationDetails.getLongitude() != null) {
            // Round to 4 decimal places (~11 meters precision)
            double roundedLat = Math.round(locationDetails.getLatitude() * 10000.0) / 10000.0;
            double roundedLon = Math.round(locationDetails.getLongitude() * 10000.0) / 10000.0;
            return String.format("%.4f,%.4f", roundedLat, roundedLon);
        }

        // Fallback to location string + city
        String city = locationDetails != null ? locationDetails.getCity() : "";
        return (location + "|" + city).toLowerCase().trim();
    }

    /**
     * Checks if two activities have the same location
     */
    public boolean hasSameLocationAs(Activity other) {
        if (this.locationDetails != null &&
                this.locationDetails.getLatitude() != null &&
                this.locationDetails.getLongitude() != null &&
                other.locationDetails != null &&
                other.locationDetails.getLatitude() != null &&
                other.locationDetails.getLongitude() != null) {

            // Use coordinates - within ~11 meters (0.0001 degrees)
            double latDiff = Math.abs(this.locationDetails.getLatitude() - other.locationDetails.getLatitude());
            double lonDiff = Math.abs(this.locationDetails.getLongitude() - other.locationDetails.getLongitude());

            return latDiff < 0.0001 && lonDiff < 0.0001;
        }

        // Fallback to string comparison
        return this.getLocationIdentifier().equals(other.getLocationIdentifier());
    }
}