package ec.edu.espe.proyecto3.subastas.api;

import ec.edu.espe.proyecto3.subastas.api.dto.SubastaDTO;
import ec.edu.espe.proyecto3.subastas.service.SubastaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/auctions")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class SubastaController {

    private final SubastaService subastaService;

    @GetMapping
    public ResponseEntity<List<SubastaDTO>> getAllAuctions() {
        return ResponseEntity.ok(subastaService.getAllAuctions());
    }

    @GetMapping("/{id}")
    public ResponseEntity<SubastaDTO> getAuctionById(@PathVariable Long id) {
        return ResponseEntity.ok(subastaService.getAuctionById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('vendedor')")
    public ResponseEntity<SubastaDTO> createAuction(@Valid @RequestBody SubastaDTO request) {
        return ResponseEntity.ok(subastaService.createAuction(request));
    }

    @GetMapping("/active")
    public ResponseEntity<List<SubastaDTO>> getActiveAuctions() {
        return ResponseEntity.ok(subastaService.getActiveAuctions());
    }
} 