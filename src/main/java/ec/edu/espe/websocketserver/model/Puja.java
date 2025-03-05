package ec.edu.espe.websocketserver.model;

import jakarta.persistence.*;
import lombok.Data;
import com.fasterxml.jackson.annotation.JsonBackReference;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "pujas")
public class Puja {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "auto_subasta_id")
    @JsonBackReference
    private AutoSubasta autoSubasta;
    
    @ManyToOne
    @JoinColumn(name = "comprador_id")
    @JsonBackReference(value = "comprador-pujas")
    private Usuario comprador;
    
    private BigDecimal monto;
    private LocalDateTime fecha;
} 