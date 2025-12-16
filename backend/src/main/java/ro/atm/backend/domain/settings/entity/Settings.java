// src/main/java/ro/atm/backend/domain/settings/entity/Settings.java
package ro.atm.backend.domain.settings.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "settings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Settings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Company Info
    @Column(length = 100, nullable = false)
    private String companyName;

    @Column(length = 500)
    private String companyDescription;

    // Contact Details
    @Column(length = 100)
    private String email;

    @Column(length = 20)
    private String phone;

    @Column(length = 200)
    private String address;

    // Social Media
    @Column(length = 200)
    private String facebookUrl;

    @Column(length = 200)
    private String instagramUrl;

    @Column(length = 200)
    private String twitterUrl;
}
