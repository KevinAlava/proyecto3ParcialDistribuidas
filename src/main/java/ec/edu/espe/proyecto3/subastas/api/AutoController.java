package ec.edu.espe.proyecto3.subastas.api;

import ec.edu.espe.proyecto3.subastas.api.dto.AutoDTO;
import ec.edu.espe.proyecto3.subastas.service.AutoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/cars")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AutoController {

    private final AutoService autoService;

    @GetMapping
    public ResponseEntity<List<AutoDTO>> getAllCars() {
        return ResponseEntity.ok(autoService.getAllCars());
    }

    @GetMapping("/{id}")
    public ResponseEntity<AutoDTO> getCarById(@PathVariable Long id) {
        return ResponseEntity.ok(autoService.getCarById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('vendedor')")
    public ResponseEntity<AutoDTO> createCar(@Valid @RequestBody AutoDTO request) {
        return ResponseEntity.ok(autoService.createCar(request));
    }

    @GetMapping("/seller")
    @PreAuthorize("hasRole('vendedor')")
    public ResponseEntity<List<AutoDTO>> getCarsBySeller() {
        return ResponseEntity.ok(autoService.getCarsBySeller());
    }
} 