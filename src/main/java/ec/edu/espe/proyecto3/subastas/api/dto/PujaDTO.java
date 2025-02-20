package ec.edu.espe.proyecto3.subastas.api.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class PujaDTO {
    private Long id;
    private Long autoId;
    private String marca;
    private String modelo;
    private BigDecimal precioActual;
    private String vendedorUsername;
    private String ultimoPostorUsername;
    private Boolean estado;
    private Boolean vendido;
} 