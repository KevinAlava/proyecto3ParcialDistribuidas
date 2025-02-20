package ec.edu.espe.proyecto3.subastas.repository;

import ec.edu.espe.proyecto3.subastas.domain.Auto;
import ec.edu.espe.proyecto3.subastas.domain.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AutoRepository extends JpaRepository<Auto, Long> {
    List<Auto> findByVendedor(Usuario vendedor);
    List<Auto> findByVendidoFalse();
    List<Auto> findByVendedorAndVendidoFalse(Usuario vendedor);
} 