package ec.edu.espe.proyecto3.subastas.service;

import ec.edu.espe.proyecto3.subastas.api.dto.PujaDTO;
import ec.edu.espe.proyecto3.subastas.api.dto.UsuarioDTO;
import ec.edu.espe.proyecto3.subastas.domain.Auto;
import ec.edu.espe.proyecto3.subastas.domain.DetalleSubasta;
import ec.edu.espe.proyecto3.subastas.domain.Usuario;
import ec.edu.espe.proyecto3.subastas.repository.AutoRepository;
import ec.edu.espe.proyecto3.subastas.repository.DetalleSubastaRepository;
import ec.edu.espe.proyecto3.subastas.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PujaService {
    private final DetalleSubastaRepository detalleSubastaRepository;
    private final UsuarioRepository usuarioRepository;
    private final AutoRepository autoRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public PujaDTO placeBid(PujaDTO request) {
        return realizarPuja(request.getAutoId(), request.getPrecioActual());
    }

    public List<PujaDTO> getBidsByAuction(Long auctionId) {
        Auto auto = autoRepository.findById(auctionId)
                .orElseThrow(() -> new RuntimeException("Auto no encontrado"));
        
        return detalleSubastaRepository.findByAuto(auto).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public List<PujaDTO> getUserBids() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        Usuario postor = usuarioRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        return detalleSubastaRepository.findByUltimoPostor(postor).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public PujaDTO realizarPuja(Long autoId, BigDecimal monto) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        Usuario postor = usuarioRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        Auto auto = autoRepository.findById(autoId)
                .orElseThrow(() -> new RuntimeException("Auto no encontrado"));

        if (auto.getVendedor().equals(postor)) {
            throw new RuntimeException("El vendedor no puede pujar por su propio auto");
        }

        DetalleSubasta detalleSubasta = detalleSubastaRepository.findByAutoAndEstadoTrue(auto)
                .orElseThrow(() -> new RuntimeException("Subasta no encontrada o finalizada"));

        if (monto.compareTo(detalleSubasta.getPrecioActual()) <= 0) {
            throw new RuntimeException("El monto debe ser mayor al precio actual");
        }

        detalleSubasta.setPrecioActual(monto);
        detalleSubasta.setUltimoPostor(postor);
        detalleSubasta = detalleSubastaRepository.save(detalleSubasta);

        return mapToDTO(detalleSubasta);
    }

    private PujaDTO mapToDTO(DetalleSubasta detalleSubasta) {
        PujaDTO dto = new PujaDTO();
        dto.setId(detalleSubasta.getId());
        dto.setAutoId(detalleSubasta.getAuto().getId());
        dto.setMarca(detalleSubasta.getAuto().getMarca());
        dto.setModelo(detalleSubasta.getAuto().getModelo());
        dto.setPrecioActual(detalleSubasta.getPrecioActual());
        dto.setVendedorUsername(detalleSubasta.getAuto().getVendedor().getUsername());
        dto.setEstado(detalleSubasta.getEstado());
        dto.setVendido(detalleSubasta.getVendido());
        
        if (detalleSubasta.getUltimoPostor() != null) {
            dto.setUltimoPostorUsername(detalleSubasta.getUltimoPostor().getUsername());
        }
        
        return dto;
    }
} 