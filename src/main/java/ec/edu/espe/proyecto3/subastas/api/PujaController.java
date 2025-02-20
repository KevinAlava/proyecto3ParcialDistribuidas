package ec.edu.espe.proyecto3.subastas.api;

import ec.edu.espe.proyecto3.subastas.api.dto.PujaDTO;
import ec.edu.espe.proyecto3.subastas.service.PujaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/bids")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class PujaController {

    private final PujaService pujaService;

    @PostMapping
    @PreAuthorize("hasRole('comprador')")
    public ResponseEntity<PujaDTO> placeBid(@Valid @RequestBody PujaDTO request) {
        return ResponseEntity.ok(pujaService.placeBid(request));
    }

    @GetMapping("/auction/{auctionId}")
    public ResponseEntity<List<PujaDTO>> getBidsByAuction(@PathVariable Long auctionId) {
        return ResponseEntity.ok(pujaService.getBidsByAuction(auctionId));
    }

    @MessageMapping("/bid")
    @SendTo("/topic/auction")
    public PujaDTO handleBid(PujaDTO bid) {
        return pujaService.placeBid(bid);
    }

    @GetMapping("/user")
    @PreAuthorize("hasRole('comprador')")
    public ResponseEntity<List<PujaDTO>> getUserBids() {
        return ResponseEntity.ok(pujaService.getUserBids());
    }
} 