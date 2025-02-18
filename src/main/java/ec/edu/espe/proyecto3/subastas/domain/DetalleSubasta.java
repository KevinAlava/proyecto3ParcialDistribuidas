package ec.edu.espe.proyecto3.subastas.domain;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;

@Data
@Entity
@Table(name = "detalle_subasta")
public class DetalleSubasta {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @ManyToOne
    @JoinColumn(name = "subasta_id", nullable = false)
    private Subasta subasta;

    @ManyToOne
    @JoinColumn(name = "auto_id", nullable = false)
    private Auto auto;

    @Column(name = "precio_actual")
    private BigDecimal precioActual;

    @ManyToOne
    @JoinColumn(name = "ultimo_postor_id")
    private Usuario ultimoPostor;

    @Column(name = "estado")
    private Boolean estado;

    @Column(name = "vendido")
    private Boolean vendido;

    @PrePersist
    public void prePersist() {
        this.estado = true;
        this.vendido = false;
        this.precioActual = this.auto.getPrecioBase();
    }
} 