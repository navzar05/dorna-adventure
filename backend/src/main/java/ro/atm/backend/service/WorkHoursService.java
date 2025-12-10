package ro.atm.backend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import ro.atm.backend.dto.WorkHoursDTO;
import ro.atm.backend.entity.WorkHours;
import ro.atm.backend.repo.WorkHoursRepository;

import java.time.DayOfWeek;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WorkHoursService {

    private final WorkHoursRepository workHoursRepository;

    public List<WorkHoursDTO> getAllWorkHours() {
        return workHoursRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public WorkHoursDTO getWorkHoursByDay(DayOfWeek dayOfWeek) {
        return workHoursRepository.findByDayOfWeek(dayOfWeek)
                .map(this::toDTO)
                .orElse(null);
    }

    public WorkHoursDTO createOrUpdateWorkHours(WorkHoursDTO dto) {
        WorkHours workHours = workHoursRepository.findByDayOfWeek(dto.getDayOfWeek())
                .orElse(new WorkHours());

        workHours.setDayOfWeek(dto.getDayOfWeek());
        workHours.setStartTime(dto.getStartTime());
        workHours.setEndTime(dto.getEndTime());
        workHours.setActive(dto.getActive() != null ? dto.getActive() : true);

        WorkHours saved = workHoursRepository.save(workHours);
        return toDTO(saved);
    }

    public void deleteWorkHours(Long id) {
        workHoursRepository.deleteById(id);
    }

    private WorkHoursDTO toDTO(WorkHours workHours) {
        return WorkHoursDTO.builder()
                .id(workHours.getId())
                .dayOfWeek(workHours.getDayOfWeek())
                .startTime(workHours.getStartTime())
                .endTime(workHours.getEndTime())
                .active(workHours.getActive())
                .build();
    }
}