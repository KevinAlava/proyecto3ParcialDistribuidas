package ec.edu.espe.proyecto3.subastas.repository;

import ec.edu.espe.proyecto3.subastas.domain.DetalleSubasta;
import ec.edu.espe.proyecto3.subastas.domain.Subasta;
import ec.edu.espe.proyecto3.subastas.domain.Auto;
import ec.edu.espe.proyecto3.subastas.domain.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface DetalleSubastaRepository extends JpaRepository<DetalleSubasta, Long> {
    List<DetalleSubasta> findBySubasta(Subasta subasta);
    Optional<DetalleSubasta> findBySubastaAndAuto(Subasta subasta, Auto auto);
    List<DetalleSubasta> findByAutoAndVendidoFalse(Auto auto);
    Optional<DetalleSubasta> findByAutoAndEstadoTrue(Auto auto);
    List<DetalleSubasta> findByAuto(Auto auto);
    List<DetalleSubasta> findByUltimoPostor(Usuario postor);
} 