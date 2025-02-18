package ec.edu.espe.proyecto3.subastas.api.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class PujaDTO {
    private Long id;
    private BigDecimal amount;
    private UsuarioDTO bidder;
    private Long auctionId;
} 