package ec.edu.espe.proyecto3.subastas.api.dto;

import lombok.Data;
import java.util.Date;

@Data
public class SubastaDTO {
    private Long id;
    private Date startTime;
    private Date endTime;
    private AutoDTO car;
} 