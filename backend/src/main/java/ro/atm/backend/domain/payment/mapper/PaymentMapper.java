package ro.atm.backend.domain.payment.mapper;

import org.springframework.stereotype.Component;
import ro.atm.backend.domain.payment.dto.PaymentDTO;
import ro.atm.backend.domain.payment.entity.Payment;

/**
 * Mapper for Payment entity and DTOs
 */
@Component
public class PaymentMapper {

    /**
     * Converts Payment entity to PaymentDTO.
     *
     * @param payment The Payment entity to convert
     * @return The converted PaymentDTO
     */
    public PaymentDTO toDTO(Payment payment) {
        if (payment == null) {
            return null;
        }

        return PaymentDTO.builder()
                .id(payment.getId())
                .bookingId(payment.getBooking().getId())
                .amount(payment.getAmount())
                .paymentType(payment.getPaymentType().name())
                .paymentMethod(payment.getPaymentMethod().name())
                .status(payment.getStatus().name())
                .createdAt(payment.getCreatedAt())
                .completedAt(payment.getCompletedAt())
                .build();
    }

    /**
     * Converts Payment.PaymentStatus enum to String.
     *
     * @param status The PaymentStatus enum
     * @return The status as a string
     */
    public String paymentStatusToString(Payment.PaymentStatus status) {
        return status != null ? status.name() : null;
    }

    /**
     * Converts Payment.PaymentType enum to String.
     *
     * @param type The PaymentType enum
     * @return The type as a string
     */
    public String paymentTypeToString(Payment.PaymentType type) {
        return type != null ? type.name() : null;
    }

    /**
     * Converts Payment.PaymentMethod enum to String.
     *
     * @param method The PaymentMethod enum
     * @return The method as a string
     */
    public String paymentMethodToString(Payment.PaymentMethod method) {
        return method != null ? method.name() : null;
    }
}
