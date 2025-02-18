package ec.edu.espe.proyecto3.subastas.service;

import ec.edu.espe.proyecto3.subastas.api.dto.PujaDTO;
import ec.edu.espe.proyecto3.subastas.api.dto.UsuarioDTO;
import ec.edu.espe.proyecto3.subastas.domain.Puja;
import ec.edu.espe.proyecto3.subastas.domain.Subasta;
import ec.edu.espe.proyecto3.subastas.domain.Usuario;
import ec.edu.espe.proyecto3.subastas.repository.PujaRepository;
import ec.edu.espe.proyecto3.subastas.repository.SubastaRepository;
import ec.edu.espe.proyecto3.subastas.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PujaService {
    private final PujaRepository pujaRepository;
    private final SubastaRepository subastaRepository;
    private final UsuarioRepository usuarioRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public PujaDTO placeBid(PujaDTO request) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        Usuario bidder = usuarioRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        Subasta auction = subastaRepository.findById(request.getAuctionId())
                .orElseThrow(() -> new RuntimeException("Subasta no encontrada"));

        validateBid(request, auction, bidder);

        Puja puja = new Puja();
        puja.setAmount(request.getAmount());
        puja.setBidder(bidder);
        puja.setAuction(auction);

        puja = pujaRepository.save(puja);
        
        PujaDTO response = mapToDTO(puja);
        messagingTemplate.convertAndSend("/topic/auction/" + auction.getId(), response);
        
        return response;
    }

    public List<PujaDTO> getBidsByAuction(Long auctionId) {
        Subasta auction = subastaRepository.findById(auctionId)
                .orElseThrow(() -> new RuntimeException("Subasta no encontrada"));

        return pujaRepository.findByAuctionOrderByAmountDesc(auction)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public List<PujaDTO> getUserBids() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        Usuario bidder = usuarioRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        return pujaRepository.findByBidder(bidder)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    private void validateBid(PujaDTO request, Subasta auction, Usuario bidder) {
        Date now = new Date();
        if (now.before(auction.getStartTime()) || now.after(auction.getEndTime())) {
            throw new RuntimeException("La subasta no está activa");
        }

        if (auction.getCar().getSeller().getId().equals(bidder.getId())) {
            throw new RuntimeException("El vendedor no puede pujar en su propia subasta");
        }

        Puja highestBid = pujaRepository.findHighestBidForAuction(auction);
        if (highestBid != null && request.getAmount().compareTo(highestBid.getAmount()) <= 0) {
            throw new RuntimeException("La puja debe ser mayor que la puja más alta actual");
        }
    }

    private PujaDTO mapToDTO(Puja puja) {
        PujaDTO dto = new PujaDTO();
        dto.setId(puja.getId());
        dto.setAmount(puja.getAmount());
        dto.setAuctionId(puja.getAuction().getId());

        UsuarioDTO bidderDTO = new UsuarioDTO();
        bidderDTO.setId(puja.getBidder().getId());
        bidderDTO.setUsername(puja.getBidder().getUsername());
        bidderDTO.setRole(puja.getBidder().getRole());
        dto.setBidder(bidderDTO);

        return dto;
    }
} 