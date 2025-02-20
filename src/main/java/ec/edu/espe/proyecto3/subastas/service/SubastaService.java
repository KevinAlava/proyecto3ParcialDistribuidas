package ec.edu.espe.proyecto3.subastas.service;

import ec.edu.espe.proyecto3.subastas.api.dto.AutoDTO;
import ec.edu.espe.proyecto3.subastas.api.dto.SubastaDTO;
import ec.edu.espe.proyecto3.subastas.domain.Auto;
import ec.edu.espe.proyecto3.subastas.domain.Subasta;
import ec.edu.espe.proyecto3.subastas.domain.EstadoSubasta;
import ec.edu.espe.proyecto3.subastas.repository.AutoRepository;
import ec.edu.espe.proyecto3.subastas.repository.SubastaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SubastaService {
    private final SubastaRepository subastaRepository;
    private final AutoRepository autoRepository;
    private final AutoService autoService;
    private final SimpMessagingTemplate messagingTemplate;

    public List<SubastaDTO> getAllAuctions() {
        return subastaRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public SubastaDTO getAuctionById(Long id) {
        return subastaRepository.findById(id)
                .map(this::mapToDTO)
                .orElseThrow(() -> new RuntimeException("Subasta no encontrada"));
    }

    @Transactional
    public SubastaDTO createAuction(SubastaDTO request) {
        Auto car = autoRepository.findById(request.getCar().getId())
                .orElseThrow(() -> new RuntimeException("Auto no encontrado"));

        if (car.getVendido()) {
            throw new RuntimeException("El auto ya ha sido vendido");
        }

        Subasta subasta = new Subasta();
        subasta.setStartTime(request.getStartTime());
        subasta.setEndTime(request.getEndTime());
        subasta.setCar(car);
        subasta.setEstadoSubasta(EstadoSubasta.PENDIENTE);

        subasta = subastaRepository.save(subasta);
        
        SubastaDTO response = mapToDTO(subasta);
        messagingTemplate.convertAndSend("/topic/auctions", response);
        
        return response;
    }

    public List<SubastaDTO> getActiveAuctions() {
        Date now = new Date();
        return subastaRepository.findByStartTimeBeforeAndEndTimeAfterAndEstadoSubasta(
                now, now, EstadoSubasta.EN_PROGRESO)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    private SubastaDTO mapToDTO(Subasta subasta) {
        SubastaDTO dto = new SubastaDTO();
        dto.setId(subasta.getId());
        dto.setStartTime(subasta.getStartTime());
        dto.setEndTime(subasta.getEndTime());
        dto.setCar(autoService.getCarById(subasta.getCar().getId()));
        return dto;
    }
} 