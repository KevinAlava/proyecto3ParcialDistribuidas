package ec.edu.espe.websocketserver.controller;

import ec.edu.espe.websocketserver.model.Usuario;
import ec.edu.espe.websocketserver.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*", allowedHeaders = "*", methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.OPTIONS})
public class AdminController {

    @Autowired
    private AuthService authService;

    @PutMapping("/usuarios/{userId}/activar")
    public ResponseEntity<?> activarUsuario(@PathVariable Long userId, Authentication auth) {
        try {
            Usuario admin = authService.obtenerUsuarioPorUsername(auth.getName());
            if (admin.getTipoUsuario() != Usuario.TipoUsuario.ADMIN) {
                return ResponseEntity.status(403).body("No tiene permisos de administrador");
            }
            
            Usuario usuario = authService.activarUsuario(userId);
            return ResponseEntity.ok(usuario);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/usuarios/{userId}/desactivar")
    public ResponseEntity<?> desactivarUsuario(@PathVariable Long userId, Authentication auth) {
        try {
            Usuario admin = authService.obtenerUsuarioPorUsername(auth.getName());
            if (admin.getTipoUsuario() != Usuario.TipoUsuario.ADMIN) {
                return ResponseEntity.status(403).body("No tiene permisos de administrador");
            }
            
            Usuario usuario = authService.desactivarUsuario(userId);
            return ResponseEntity.ok(usuario);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/usuarios")
    public ResponseEntity<?> listarUsuarios(Authentication auth) {
        try {
            Usuario admin = authService.obtenerUsuarioPorUsername(auth.getName());
            if (admin.getTipoUsuario() != Usuario.TipoUsuario.ADMIN) {
                return ResponseEntity.status(403).body("No tiene permisos de administrador");
            }
            
            return ResponseEntity.ok(authService.listarUsuarios());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
} 