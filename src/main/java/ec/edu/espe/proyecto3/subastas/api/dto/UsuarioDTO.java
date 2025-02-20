package ec.edu.espe.proyecto3.subastas.api.dto;

import ec.edu.espe.proyecto3.subastas.domain.Role;
import lombok.Data;

@Data
public class UsuarioDTO {
    private Long id;
    private String username;
    private Role role;
} 