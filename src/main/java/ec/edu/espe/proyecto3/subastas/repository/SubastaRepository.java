package ec.edu.espe.proyecto3.subastas.repository;

import ec.edu.espe.proyecto3.subastas.domain.Subasta;
import ec.edu.espe.proyecto3.subastas.domain.EstadoSubasta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Date;

@Repository
public interface SubastaRepository extends JpaRepository<Subasta, Long> {
    List<Subasta> findByEstadoSubasta(EstadoSubasta estadoSubasta);
    List<Subasta> findByStartTimeBeforeAndEndTimeAfterAndEstadoSubasta(
        Date currentDate, Date currentDate2, EstadoSubasta estadoSubasta);
    List<Subasta> findByEndTimeBeforeAndEstadoSubasta(
        Date currentDate, EstadoSubasta estadoSubasta);
} 