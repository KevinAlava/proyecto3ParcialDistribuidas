package ec.edu.espe.proyecto3.subastas.api;

import ec.edu.espe.proyecto3.subastas.api.dto.AuthResponseDTO;
import ec.edu.espe.proyecto3.subastas.api.dto.LoginDTO;
import ec.edu.espe.proyecto3.subastas.api.dto.RegistroUsuarioDTO;
import ec.edu.espe.proyecto3.subastas.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponseDTO> register(@Valid @RequestBody RegistroUsuarioDTO request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponseDTO> login(@Valid @RequestBody LoginDTO request) {
        return ResponseEntity.ok(authService.login(request));
    }
} 