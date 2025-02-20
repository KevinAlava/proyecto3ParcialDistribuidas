package ec.edu.espe.proyecto3.subastas.domain;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;

@Data
@Entity
@Table(name = "bids")
public class Puja {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @ManyToOne
    @JoinColumn(name = "bidder_id", nullable = false)
    private Usuario bidder;

    @ManyToOne
    @JoinColumn(name = "auction_id", nullable = false)
    private Subasta auction;
} 