package ec.edu.espe.proyecto3.subastas.domain;

import jakarta.persistence.*;
import lombok.Data;
import java.util.Date;
import java.util.List;

@Data
@Entity
@Table(name = "auctions")
public class Subasta {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "start_time", nullable = false)
    @Temporal(TemporalType.TIMESTAMP)
    private Date startTime;

    @Column(name = "end_time", nullable = false)
    @Temporal(TemporalType.TIMESTAMP)
    private Date endTime;

    @ManyToOne
    @JoinColumn(name = "car_id", nullable = false)
    private Auto car;

    @Column(name = "estado")
    private Boolean estado;

    @Column(name = "estado_subasta")
    @Enumerated(EnumType.STRING)
    private EstadoSubasta estadoSubasta;

    @OneToMany(mappedBy = "subasta", cascade = CascadeType.ALL)
    private List<DetalleSubasta> detallesSubasta;

    @PrePersist
    public void prePersist() {
        this.estado = true;
        this.estadoSubasta = EstadoSubasta.PENDIENTE;
    }
} 