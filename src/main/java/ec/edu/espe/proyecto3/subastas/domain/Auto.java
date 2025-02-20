package ec.edu.espe.proyecto3.subastas.domain;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;

@Data
@Entity
@Table(name = "auto")
public class Auto {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "marca")
    private String marca;

    @Column(name = "modelo")
    private String modelo;

    @Column(name = "anio")
    private Integer anio;

    @Column(name = "precio_base")
    private BigDecimal precioBase;

    @Column(name = "descripcion", length = 1000)
    private String descripcion;

    @Column(name = "estado")
    private Boolean estado;

    @Column(name = "vendido")
    private Boolean vendido;

    @ManyToOne
    @JoinColumn(name = "vendedor_id", nullable = false)
    private Usuario vendedor;

    @PrePersist
    public void prePersist() {
        this.estado = true;
        this.vendido = false;
    }
} 