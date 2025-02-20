package ec.edu.espe.proyecto3.subastas.service;

import ec.edu.espe.proyecto3.subastas.api.dto.AuthResponseDTO;
import ec.edu.espe.proyecto3.subastas.api.dto.LoginDTO;
import ec.edu.espe.proyecto3.subastas.api.dto.RegistroUsuarioDTO;
import org.springframework.stereotype.Service;

@Service
public class AuthService {
    
    public AuthResponseDTO register(RegistroUsuarioDTO request) {
        return AuthResponseDTO.builder()
            .token("token-generado")
            .mensaje("Usuario registrado exitosamente")
            .build();
    }

    public AuthResponseDTO login(LoginDTO request) {
        return AuthResponseDTO.builder()
            .token("token-generado")
            .mensaje("Login exitoso")
            .build();
    }
} 