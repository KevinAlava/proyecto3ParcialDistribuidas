package ec.edu.espe.proyecto3.subastas.api.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class AutoDTO {
    private Long id;
    private String make;
    private String model;
    private Integer year;
    private BigDecimal basePrice;
    private UsuarioDTO seller;
} 