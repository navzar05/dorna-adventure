package ro.atm.backend.common.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import ro.atm.backend.domain.auth.entity.User;
import ro.atm.backend.domain.auth.entity.Role;
import ro.atm.backend.domain.user.repository.UserRepository;
import ro.atm.backend.domain.user.repository.RoleRepository;
import ro.atm.backend.domain.activity.entity.Activity;
import ro.atm.backend.domain.activity.entity.ActivityCategory;
import ro.atm.backend.domain.activity.entity.LocationDetails;
import ro.atm.backend.domain.activity.repository.ActivityRepository;
import ro.atm.backend.domain.activity.repository.ActivityCategoryRepository;
import ro.atm.backend.common.constants.SecurityConstants;
import ro.atm.backend.common.exception.ResourceNotFoundException;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.Set;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final ActivityCategoryRepository categoryRepository;
    private final ActivityRepository activityRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        initializeRoles();
        initializeUsers();
//        initializeCategories();
//        initializeActivities();
    }


    private void initializeRoles() {
        if (roleRepository.count() == 0) {
            log.info("Initializing roles...");

            Role userRole = new Role();
            userRole.setName(SecurityConstants.Roles.USER);
            roleRepository.save(userRole);

            Role adminRole = new Role();
            adminRole.setName(SecurityConstants.Roles.ADMIN);
            roleRepository.save(adminRole);

            Role moderatorRole = new Role();
            moderatorRole.setName(SecurityConstants.Roles.EMPLOYEE);
            roleRepository.save(moderatorRole);

            log.info("Roles initialized successfully!");
        } else {
            log.info("Roles already exist, skipping initialization.");
        }
    }

    private void initializeUsers() {
        if (userRepository.count() == 0) {
            log.info("Initializing default users...");

            // Get roles
            Role adminRole = roleRepository.findByName(SecurityConstants.Roles.ADMIN)
                    .orElseThrow(() -> new ResourceNotFoundException("Role", SecurityConstants.Roles.ADMIN));
            Role userRole = roleRepository.findByName(SecurityConstants.Roles.USER)
                    .orElseThrow(() -> new ResourceNotFoundException("Role", SecurityConstants.Roles.USER));
            Role employeeRole = roleRepository.findByName(SecurityConstants.Roles.EMPLOYEE)
                    .orElseThrow(() -> new ResourceNotFoundException("Role", SecurityConstants.Roles.EMPLOYEE));

            // Create admin user
            User admin = User.builder()
                    .username("admin")
                    .password(passwordEncoder.encode("admin123"))
                    .email("admin@dornaadventure.ro") // Add email
                    .firstName("Admin")
                    .lastName("User")
                    .phoneNumber("+40 700 000 001")
                    .roles(Set.of(adminRole, userRole,employeeRole))
                    .accountNonExpired(true)
                    .accountNonLocked(true)
                    .credentialsNonExpired(true)
                    .enabled(true)
                    .build();
            userRepository.save(admin);
            log.info("Admin user created - Username: admin, Password: admin123");

            // Create a regular test user
            User testUser = User.builder()
                    .username("user")
                    .password(passwordEncoder.encode("user123"))
                    .email("user@dornaadventure.ro") // Add email
                    .firstName("Test")
                    .lastName("User")
                    .phoneNumber("+40 700 000 002")
                    .roles(Set.of(userRole))
                    .accountNonExpired(true)
                    .accountNonLocked(true)
                    .credentialsNonExpired(true)
                    .enabled(true)
                    .build();
            userRepository.save(testUser);
            log.info("Test user created - Username: user, Password: user123");

            log.info("Default users initialized successfully!");
            log.warn("WARNING: Please change the default passwords in production!");
        } else {
            log.info("Users already exist, skipping initialization.");
        }
    }


    private void initializeCategories() {
        if (categoryRepository.count() == 0) {
            log.info("Initializing activity categories...");

            categoryRepository.save(ActivityCategory.builder()
                    .name("Adventure")
                    .slug("adventure")
                    .description("Thrilling outdoor activities for adrenaline seekers")
                    .displayOrder(1)
                    .active(true)
                    .build());

            categoryRepository.save(ActivityCategory.builder()
                    .name("Cultural")
                    .slug("cultural")
                    .description("Museums, historical sites, and cultural experiences")
                    .displayOrder(2)
                    .active(true)
                    .build());

            categoryRepository.save(ActivityCategory.builder()
                    .name("Water Sports")
                    .slug("water-sports")
                    .description("Kayaking, diving, surfing and more")
                    .displayOrder(3)
                    .active(true)
                    .build());

            categoryRepository.save(ActivityCategory.builder()
                    .name("Mountain")
                    .slug("mountain")
                    .description("Hiking, climbing, and mountain adventures")
                    .displayOrder(4)
                    .active(true)
                    .build());

            categoryRepository.save(ActivityCategory.builder()
                    .name("City Tour")
                    .slug("city-tour")
                    .description("Guided tours of cities and urban attractions")
                    .displayOrder(5)
                    .active(true)
                    .build());

            categoryRepository.save(ActivityCategory.builder()
                    .name("Food & Wine")
                    .slug("food-wine")
                    .description("Culinary tours, wine tasting, and gastronomic experiences")
                    .displayOrder(6)
                    .active(true)
                    .build());

            categoryRepository.save(ActivityCategory.builder()
                    .name("Wellness")
                    .slug("wellness")
                    .description("Spa, yoga, meditation and relaxation activities")
                    .displayOrder(7)
                    .active(true)
                    .build());

            categoryRepository.save(ActivityCategory.builder()
                    .name("Family")
                    .slug("family")
                    .description("Fun activities suitable for all ages")
                    .displayOrder(8)
                    .active(true)
                    .build());

            log.info("Activity categories initialized successfully!");
        } else {
            log.info("Activity categories already exist, skipping initialization.");
        }
    }

    private void initializeActivities() {
        if (activityRepository.count() == 0) {
            log.info("Initializing sample activities...");

            // Get categories
            ActivityCategory adventure = categoryRepository.findBySlug("adventure").orElse(null);
            ActivityCategory cultural = categoryRepository.findBySlug("cultural").orElse(null);
            ActivityCategory waterSports = categoryRepository.findBySlug("water-sports").orElse(null);
            ActivityCategory mountain = categoryRepository.findBySlug("mountain").orElse(null);
            ActivityCategory cityTour = categoryRepository.findBySlug("city-tour").orElse(null);
            ActivityCategory foodWine = categoryRepository.findBySlug("food-wine").orElse(null);

            // Adventure Activities
            if (adventure != null) {
                activityRepository.save(Activity.builder()
                        .name("Paragliding Over the Mountains")
                        .description("Experience the thrill of flying like a bird! Tandem paragliding with experienced instructors over stunning mountain landscapes. No previous experience required.")
                        .minParticipants(1)
                        .maxParticipants(2)
                        .pricePerPerson(new BigDecimal("150.00"))
                        .depositPercent(new BigDecimal("30.00"))
                        .durationMinutes(180)
                        .location("Brașov, Romania")
                        .locationDetails(LocationDetails.builder()
                                .city("Brașov")
                                .latitude(45.6580)
                                .longitude(25.6012)
                                .build())
                        .category(adventure)
                        .active(true)
                        .build());

                activityRepository.save(Activity.builder()
                        .name("Zip Line Adventure")
                        .description("Soar through the forest canopy on Romania's longest zip line course. Multiple lines ranging from 100m to 800m. Safety equipment and training included.")
                        .minParticipants(2)
                        .maxParticipants(10)
                        .pricePerPerson(new BigDecimal("75.00"))
                        .depositPercent(new BigDecimal("20.00"))
                        .durationMinutes(120)
                        .location("Sinaia, Romania")
                        .locationDetails(LocationDetails.builder()
                                .city("Sinaia")
                                .latitude(45.3500)
                                .longitude(25.5500)
                                .build())
                        .category(adventure)
                        .active(true)
                        .build());
            }

            // Cultural Activities
            if (cultural != null) {
                activityRepository.save(Activity.builder()
                        .name("Dracula's Castle Tour")
                        .description("Explore the legendary Bran Castle, commonly known as Dracula's Castle. Learn about the history of Vlad the Impaler and Romanian medieval architecture. Includes guided tour and entry tickets.")
                        .minParticipants(1)
                        .maxParticipants(25)
                        .pricePerPerson(new BigDecimal("45.00"))
                        .depositPercent(new BigDecimal("10.00"))
                        .durationMinutes(150)
                        .location("Bran, Brașov County, Romania")
                        .locationDetails(LocationDetails.builder()
                                .city("Bran")
                                .latitude(45.5151)
                                .longitude(25.3671)
                                .build())
                        .category(cultural)
                        .active(true)
                        .build());

                activityRepository.save(Activity.builder()
                        .name("Old Town Bucharest Walking Tour")
                        .description("Discover the charm of Bucharest's historic center. Visit Stavropoleos Church, Hanul lui Manuc, and learn about the city's fascinating past. Small group tour with local expert guide.")
                        .minParticipants(4)
                        .maxParticipants(15)
                        .pricePerPerson(new BigDecimal("30.00"))
                        .depositPercent(new BigDecimal("15.00"))
                        .durationMinutes(180)
                        .location("Bucharest Old Town, Romania")
                        .locationDetails(LocationDetails.builder()
                                .city("Bucharest")
                                .latitude(44.4268)
                                .longitude(26.1025)
                                .build())
                        .category(cultural)
                        .active(true)
                        .build());
            }

            // Water Sports
            if (waterSports != null) {
                activityRepository.save(Activity.builder()
                        .name("Danube Delta Kayaking")
                        .description("Paddle through the UNESCO-protected Danube Delta, home to over 300 bird species. Full-day kayaking trip with experienced guide, equipment, and lunch included.")
                        .minParticipants(4)
                        .maxParticipants(12)
                        .pricePerPerson(new BigDecimal("95.00"))
                        .depositPercent(new BigDecimal("25.00"))
                        .durationMinutes(480)
                        .location("Tulcea, Danube Delta, Romania")
                        .locationDetails(LocationDetails.builder()
                                .city("Tulcea")
                                .latitude(45.1781)
                                .longitude(28.8050)
                                .build())
                        .category(waterSports)
                        .active(true)
                        .build());

                activityRepository.save(Activity.builder()
                        .name("White Water Rafting")
                        .description("Tackle the rapids of the Jiu River! Exciting white water rafting experience suitable for beginners and intermediates. All safety gear and professional guides provided.")
                        .minParticipants(6)
                        .maxParticipants(12)
                        .pricePerPerson(new BigDecimal("85.00"))
                        .depositPercent(new BigDecimal("30.00"))
                        .durationMinutes(240)
                        .location("Gorj County, Romania")
                        .locationDetails(LocationDetails.builder()
                                .city("Bumbești-Jiu")
                                .latitude(45.0833)
                                .longitude(23.2167)
                                .build())
                        .category(waterSports)
                        .active(true)
                        .build());
            }

            // Mountain Activities
            if (mountain != null) {
                activityRepository.save(Activity.builder()
                        .name("Carpathian Mountains Hiking")
                        .description("Full-day guided hiking in the beautiful Carpathian Mountains. Moderate difficulty trail with stunning views. Transportation, guide, and traditional mountain lunch included.")
                        .minParticipants(4)
                        .maxParticipants(15)
                        .pricePerPerson(new BigDecimal("65.00"))
                        .depositPercent(new BigDecimal("20.00"))
                        .durationMinutes(420)
                        .location("Făgăraș Mountains, Romania")
                        .locationDetails(LocationDetails.builder()
                                .city("Victoria")
                                .latitude(45.7167)
                                .longitude(24.7167)
                                .build())
                        .category(mountain)
                        .active(true)
                        .build());
            }

            // City Tours
            if (cityTour != null) {
                activityRepository.save(Activity.builder()
                        .name("Communist Bucharest Tour")
                        .description("Explore Bucharest's communist heritage including the Palace of Parliament (world's second-largest building), Revolution Square, and communist-era neighborhoods. Insightful historical tour.")
                        .minParticipants(2)
                        .maxParticipants(20)
                        .pricePerPerson(new BigDecimal("40.00"))
                        .depositPercent(new BigDecimal("15.00"))
                        .durationMinutes(240)
                        .location("Bucharest, Romania")
                        .locationDetails(LocationDetails.builder()
                                .city("Bucharest")
                                .latitude(44.4268)
                                .longitude(26.1025)
                                .build())
                        .category(cityTour)
                        .active(true)
                        .build());
            }

            // Food & Wine
            if (foodWine != null) {
                activityRepository.save(Activity.builder()
                        .name("Romanian Wine Tasting Experience")
                        .description("Discover Romanian wines at a local winery. Taste 5 premium wines paired with traditional Romanian cheeses and appetizers. Learn about local wine-making traditions.")
                        .minParticipants(2)
                        .maxParticipants(16)
                        .pricePerPerson(new BigDecimal("55.00"))
                        .depositPercent(new BigDecimal("25.00"))
                        .durationMinutes(150)
                        .location("Dealu Mare Wine Region, Romania")
                        .locationDetails(LocationDetails.builder()
                                .city("Urlați")
                                .latitude(45.1333)
                                .longitude(26.2333)
                                .build())
                        .category(foodWine)
                        .active(true)
                        .build());

                activityRepository.save(Activity.builder()
                        .name("Traditional Romanian Cooking Class")
                        .description("Learn to cook authentic Romanian dishes! Hands-on cooking class where you'll prepare sarmale, mici, and papanași. Enjoy your creations with local wine. Recipe booklet included.")
                        .minParticipants(4)
                        .maxParticipants(10)
                        .pricePerPerson(new BigDecimal("70.00"))
                        .depositPercent(new BigDecimal("30.00"))
                        .durationMinutes(210)
                        .location("Bucharest, Romania")
                        .locationDetails(LocationDetails.builder()
                                .city("Bucharest")
                                .latitude(44.4268)
                                .longitude(26.1025)
                                .build())
                        .category(foodWine)
                        .active(true)
                        .build());
            }

            log.info("Sample activities initialized successfully!");
        } else {
            log.info("Activities already exist, skipping initialization.");
        }
    }
}
