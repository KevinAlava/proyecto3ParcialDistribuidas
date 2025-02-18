package ec.edu.espe.proyecto3.subastas.repository;

import ec.edu.espe.proyecto3.subastas.domain.Puja;
import ec.edu.espe.proyecto3.subastas.domain.Subasta;
import ec.edu.espe.proyecto3.subastas.domain.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PujaRepository extends JpaRepository<Puja, Long> {
    List<Puja> findByAuctionOrderByAmountDesc(Subasta auction);
    List<Puja> findByBidder(Usuario bidder);
    
    @Query("SELECT p FROM Puja p WHERE p.auction = ?1 AND p.amount = " +
           "(SELECT MAX(p2.amount) FROM Puja p2 WHERE p2.auction = ?1)")
    Puja findHighestBidForAuction(Subasta auction);
} 