package ec.edu.espe.proyecto3.subastas.service;

import ec.edu.espe.proyecto3.subastas.api.dto.AutoDTO;
import ec.edu.espe.proyecto3.subastas.api.dto.UsuarioDTO;
import ec.edu.espe.proyecto3.subastas.domain.Auto;
import ec.edu.espe.proyecto3.subastas.domain.Usuario;
import ec.edu.espe.proyecto3.subastas.repository.AutoRepository;
import ec.edu.espe.proyecto3.subastas.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AutoService {
    private final AutoRepository autoRepository;
    private final UsuarioRepository usuarioRepository;

    public List<AutoDTO> getAllCars() {
        return autoRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public AutoDTO getCarById(Long id) {
        return autoRepository.findById(id)
                .map(this::mapToDTO)
                .orElseThrow(() -> new RuntimeException("Auto no encontrado"));
    }

    @Transactional
    public AutoDTO createCar(AutoDTO request) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        Usuario vendedor = usuarioRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        Auto auto = new Auto();
        auto.setMarca(request.getMake());
        auto.setModelo(request.getModel());
        auto.setAnio(request.getYear());
        auto.setPrecioBase(request.getBasePrice());
        auto.setVendedor(vendedor);

        auto = autoRepository.save(auto);
        return mapToDTO(auto);
    }

    public List<AutoDTO> getCarsBySeller() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        Usuario vendedor = usuarioRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        return autoRepository.findByVendedorAndVendidoFalse(vendedor).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    private AutoDTO mapToDTO(Auto auto) {
        AutoDTO dto = new AutoDTO();
        dto.setId(auto.getId());
        dto.setMake(auto.getMarca());
        dto.setModel(auto.getModelo());
        dto.setYear(auto.getAnio());
        dto.setBasePrice(auto.getPrecioBase());
        
        UsuarioDTO vendedorDTO = new UsuarioDTO();
        vendedorDTO.setId(auto.getVendedor().getId());
        vendedorDTO.setUsername(auto.getVendedor().getUsername());
        vendedorDTO.setRole(auto.getVendedor().getRole());
        dto.setSeller(vendedorDTO);
        
        return dto;
    }
} 