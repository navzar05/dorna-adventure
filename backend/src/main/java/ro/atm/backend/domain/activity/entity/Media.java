package ro.atm.backend.domain.activity.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

@Entity
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class Media {

    public enum MediaType {
        IMAGE,
        VIDEO
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private MediaType mediaType;

    @ManyToOne
    @JoinColumn(nullable = false)
    @JsonIgnore
    private Activity activity;

    @Column(nullable = false, unique = true)
    private String url;
}
