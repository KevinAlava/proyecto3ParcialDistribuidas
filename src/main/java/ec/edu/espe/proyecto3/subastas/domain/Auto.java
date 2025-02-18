package ec.edu.espe.proyecto3.subastas.domain;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;

@Data
@Entity
@Table(name = "cars")
public class Auto {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "make", nullable = false, length = 50)
    private String make;

    @Column(name = "model", nullable = false, length = 50)
    private String model;

    @Column(name = "year", nullable = false)
    private Integer year;

    @Column(name = "base_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal basePrice;

    @Column(name = "descripcion", length = 1000)
    private String descripcion;

    @Column(name = "estado")
    private Boolean estado;

    @Column(name = "vendido")
    private Boolean vendido;

    @ManyToOne
    @JoinColumn(name = "seller_id", nullable = false)
    private Usuario seller;

    @PrePersist
    public void prePersist() {
        this.estado = true;
        this.vendido = false;
    }
} 