// Variables globales
let stompClient = null;
let currentUser = null;

// Conexión WebSocket
function connectWebSocket() {
    const socket = new SockJS('/subastas-ws');
    stompClient = Stomp.over(socket);
    stompClient.connect({}, function(frame) {
        console.log('Conectado: ' + frame);
        loadActiveAuctions();
        
        // Suscribirse a actualizaciones de subastas si es comprador
        if (currentUser && currentUser.tipoUsuario === 'COMPRADOR') {
            subscribeToAuctions();
        }
    });
}

function subscribeToAuctions() {
    stompClient.subscribe('/topic/subastas', function(message) {
        const subasta = JSON.parse(message.body);
        updateAuctionUI(subasta);
    });
}

// Funciones de autenticación
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    // Mostrar indicador de carga
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Iniciando sesión...';

    fetch('/api/auth/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            username: formData.get('username'),
            password: formData.get('password')
        })
    })
    .then(response => {
        if (!response.ok) {
            return response.text().then(text => {
                throw new Error(text || 'Error en la autenticación');
            });
        }
        return response.json();
    })
    .then(data => {
        if (!data.token || !data.usuario) {
            throw new Error('Respuesta del servidor inválida');
        }
        
        localStorage.setItem('token', data.token);
        localStorage.setItem('currentUser', JSON.stringify(data.usuario));
        currentUser = data.usuario;
        
        // Cerrar el modal de login
        const loginModal = document.getElementById('loginModal');
        const modal = bootstrap.Modal.getInstance(loginModal);
        modal.hide();
        
        updateUIForUser(currentUser);
        e.target.reset();
        showSuccessToast('Sesión iniciada correctamente');
        connectWebSocket();
    })
    .catch(error => {
        console.error('Error:', error);
        showErrorToast(error.message);
    })
    .finally(() => {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    });
});

// Función para verificar si hay una sesión activa al cargar la página
window.addEventListener('load', function() {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('currentUser');
    
    if (token && savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
            updateUIForUser(currentUser);
            connectWebSocket();
        } catch (error) {
            console.error('Error al restaurar la sesión:', error);
            logout();
        }
    }
});

function logout() {
    // Limpiar datos de sesión
    currentUser = null;
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    
    // Desconectar WebSocket si existe
    if (stompClient && stompClient.connected) {
        stompClient.disconnect();
    }
    
    // Restablecer la interfaz
    document.getElementById('loginSection').classList.remove('d-none');
    document.getElementById('registerSection').classList.remove('d-none');
    document.getElementById('userSection').classList.add('d-none');
    document.getElementById('controlPanel').classList.add('d-none');
    document.getElementById('misSubastasSection').style.display = 'none';
    document.getElementById('misAutosSection').style.display = 'none';
    
    // Limpiar contenedores
    document.getElementById('subastasList').innerHTML = '';
    document.getElementById('subastasActivasList').innerHTML = '';
    document.getElementById('misSubastasList').innerHTML = '';
    document.getElementById('misAutosList').innerHTML = '';
    
    // Limpiar formularios
    document.getElementById('registrarAutoForm').reset();
    document.getElementById('crearSubastaForm').reset();
    
    // Si existe el contenedor de usuarios admin, limpiarlo
    const usersListContainer = document.getElementById('usersListContainer');
    if (usersListContainer) {
        usersListContainer.innerHTML = '';
    }
    
    // Limpiar el panel de control
    const controlPanel = document.getElementById('controlPanel');
    const panelBody = controlPanel.querySelector('.card-body');
    while (panelBody.children.length > 1) {
        panelBody.removeChild(panelBody.lastChild);
    }
    
    // Mostrar mensaje de éxito
    showSuccessToast('Sesión cerrada correctamente');
    
    // Cargar subastas activas para usuarios no autenticados
    loadActiveAuctions();
}

// Funciones de UI
function updateUIForUser(user) {
    // Limpiar el panel de control antes de agregar nuevos elementos
    const controlPanel = document.getElementById('controlPanel');
    const panelBody = controlPanel.querySelector('.card-body');
    
    // Limpiar el contenido existente del panel
    while (panelBody.children.length > 1) {
        panelBody.removeChild(panelBody.lastChild);
    }
    
    // Mostrar elementos comunes
    document.getElementById('loginSection').classList.add('d-none');
    document.getElementById('registerSection').classList.add('d-none');
    document.getElementById('userSection').classList.remove('d-none');
    document.getElementById('controlPanel').classList.remove('d-none');
    document.getElementById('userInfo').textContent = `${user.nombre} (${user.tipoUsuario})`;

    // Ocultar todas las secciones primero
    document.getElementById('misAutosSection').style.display = 'none';
    document.getElementById('misSubastasSection').style.display = 'none';

    if (user.tipoUsuario === 'VENDEDOR' || user.tipoUsuario === 'ADMIN') {
        // Crear botón de nueva subasta
        const crearSubastaBtn = document.createElement('button');
        crearSubastaBtn.className = 'btn btn-primary mb-3 w-100';
        crearSubastaBtn.setAttribute('data-bs-toggle', 'modal');
        crearSubastaBtn.setAttribute('data-bs-target', '#crearSubastaModal');
        crearSubastaBtn.innerHTML = '<i class="fas fa-plus-circle me-2"></i>Crear Nueva Subasta';
        panelBody.appendChild(crearSubastaBtn);

        // Crear botón de registrar auto
        const registrarAutoBtn = document.createElement('button');
        registrarAutoBtn.className = 'btn btn-success w-100';
        registrarAutoBtn.setAttribute('data-bs-toggle', 'modal');
        registrarAutoBtn.setAttribute('data-bs-target', '#registrarAutoModal');
        registrarAutoBtn.innerHTML = '<i class="fas fa-car me-2"></i>Registrar Auto';
        panelBody.appendChild(registrarAutoBtn);

        // Mostrar secciones relevantes
        document.getElementById('misAutosSection').style.display = 'block';
        document.getElementById('misSubastasSection').style.display = 'block';

        // Cargar datos
        loadVendedorAutos();
        loadVendedorSubastas();
    }

    if (user.tipoUsuario === 'COMPRADOR') {
        // Crear botón de realizar pujas
        const realizarPujaBtn = document.createElement('button');
        realizarPujaBtn.className = 'btn btn-success w-100';
        realizarPujaBtn.innerHTML = '<i class="fas fa-gavel me-2"></i>Realizar Pujas';
        realizarPujaBtn.onclick = function() {
            if (!stompClient || !stompClient.connected) {
                connectWebSocket();
            }
            enableBidding();
            showSuccessToast('Conectado al sistema de pujas en tiempo real');
            document.getElementById('subastasActivasList').scrollIntoView({ behavior: 'smooth' });
        };
        panelBody.appendChild(realizarPujaBtn);
    }

    if (user.tipoUsuario === 'ADMIN') {
        // Crear botón para gestionar usuarios
        const gestionUsuariosBtn = document.createElement('button');
        gestionUsuariosBtn.className = 'btn btn-info w-100 mt-3';
        gestionUsuariosBtn.onclick = loadUsersList;
        gestionUsuariosBtn.innerHTML = '<i class="fas fa-users me-2"></i>Gestionar Usuarios';
        panelBody.appendChild(gestionUsuariosBtn);

        // Crear contenedor para la lista de usuarios
        const usersListContainer = document.createElement('div');
        usersListContainer.id = 'usersListContainer';
        usersListContainer.className = 'mt-3';
        panelBody.appendChild(usersListContainer);
    }

    // Cargar subastas activas para todos los usuarios
    loadActiveAuctions();
}

// Registro de auto
document.getElementById('registrarAutoForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    // Validaciones del formulario
    if (!formData.get('marca') || !formData.get('modelo') || !formData.get('anio') || 
        !formData.get('descripcion') || !formData.get('precioBase')) {
        showErrorToast('Por favor complete todos los campos');
        return;
    }

    const anio = parseInt(formData.get('anio'));
    if (isNaN(anio) || anio < 1900 || anio > new Date().getFullYear() + 1) {
        showErrorToast('Por favor ingrese un año válido');
        return;
    }

    const precioBase = parseFloat(formData.get('precioBase'));
    if (isNaN(precioBase) || precioBase <= 0) {
        showErrorToast('Por favor ingrese un precio base válido');
        return;
    }

    // Mostrar indicador de carga
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Registrando...';

    const token = localStorage.getItem('token');
    if (!token) {
        showErrorToast('No hay sesión activa');
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
        return;
    }

    const autoData = {
        marca: formData.get('marca').trim(),
        modelo: formData.get('modelo').trim(),
        anio: anio,
        descripcion: formData.get('descripcion').trim(),
        precioBase: precioBase
    };

    console.log('Enviando datos del auto:', autoData);

    fetch('/api/autos/registrar', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(autoData)
    })
    .then(async response => {
        const contentType = response.headers.get('content-type');
        const text = await response.text();
        console.log('Respuesta del servidor:', text);
        
        if (!response.ok) {
            throw new Error(text || 'Error al registrar el auto');
        }
        
        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            console.error('Error parseando respuesta:', e);
            throw new Error('Error en el formato de respuesta del servidor');
        }
        
        return data;
    })
    .then(auto => {
        console.log('Auto registrado:', auto);
        showSuccessToast('Auto registrado exitosamente');
        
        // Cerrar el modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('registrarAutoModal'));
        if (modal) {
            modal.hide();
        }
        
        // Limpiar el formulario
        e.target.reset();
        
        // Recargar las listas
        loadVendedorAutos();
    })
    .catch(error => {
        console.error('Error:', error);
        showErrorToast(error.message || 'Error al registrar el auto');
    })
    .finally(() => {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    });
});

// Registro de usuario
document.getElementById('registerForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    // Validaciones del formulario
    const username = formData.get('username');
    const password = formData.get('password');
    const email = formData.get('email');
    const nombre = formData.get('nombre');
    const apellido = formData.get('apellido');
    const tipoUsuario = formData.get('tipoUsuario');
    
    if (!username || !password || !email || !nombre || !apellido || !tipoUsuario) {
        showErrorToast('Por favor complete todos los campos');
        return;
    }
    
    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showErrorToast('Por favor ingrese un email válido');
        return;
    }
    
    // Mostrar indicador de carga
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Registrando...';

    const userData = {
        username: username.trim(),
        password: password,
        email: email.trim(),
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        tipoUsuario: tipoUsuario
    };

    console.log('Enviando datos de registro:', { ...userData, password: '****' });

    fetch('/api/auth/registro', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify(userData)
    })
    .then(async response => {
        const contentType = response.headers.get('content-type');
        const text = await response.text();
        console.log('Respuesta del servidor:', text);
        
        if (!response.ok) {
            throw new Error(text || 'Error en el registro');
        }
        
        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            console.error('Error parseando respuesta:', e);
            throw new Error('Error en el formato de respuesta del servidor');
        }
        
        return data;
    })
    .then(data => {
        showSuccessToast('Usuario registrado exitosamente');
        
        // Cerrar el modal de registro
        const registerModal = bootstrap.Modal.getInstance(document.getElementById('registerModal'));
        if (registerModal) {
            registerModal.hide();
        }
        
        // Limpiar el formulario
        e.target.reset();
    })
    .catch(error => {
        console.error('Error en el registro:', error);
        showErrorToast(error.message || 'Error en el registro');
    })
    .finally(() => {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    });
});

// Funciones de notificación
function showSuccessToast(message) {
    const toast = new bootstrap.Toast(document.getElementById('successToast'));
    document.getElementById('successToastMessage').textContent = message;
    toast.show();
}

function showErrorToast(message) {
    const toast = new bootstrap.Toast(document.getElementById('errorToast'));
    document.getElementById('errorToastMessage').textContent = message;
    toast.show();
}

// Habilitar pujas para compradores
function enableBidding() {
    const pujaButtons = document.querySelectorAll('.puja-btn');
    pujaButtons.forEach(btn => {
        btn.disabled = false;
        btn.addEventListener('click', realizarPuja);
    });
}

// Realizar puja
function realizarPuja(event) {
    event.preventDefault();
    const btn = event.target.closest('.puja-btn'); // Usar closest para asegurar que obtenemos el botón
    if (!btn) return;

    const subastaId = btn.dataset.subastaId;
    const autoId = btn.dataset.autoId;
    const precioActual = parseFloat(btn.dataset.precioActual);
    const montoInput = document.querySelector(`#monto-${subastaId}-${autoId}`);
    const monto = parseFloat(montoInput.value);

    if (!monto || isNaN(monto) || monto <= 0) {
        showErrorToast('Por favor ingrese un monto válido');
        montoInput.focus();
        return;
    }

    if (monto <= precioActual) {
        showErrorToast(`El monto debe ser mayor a $${precioActual.toFixed(2)}`);
        montoInput.focus();
        return;
    }

    // Verificar conexión WebSocket
    if (!stompClient || !stompClient.connected) {
        showErrorToast('Reconectando al sistema de pujas...');
        connectWebSocket();
        setTimeout(() => realizarPuja(event), 1000);
        return;
    }

    // Deshabilitar el botón y mostrar spinner
    btn.disabled = true;
    const originalText = btn.innerHTML;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Pujando...';
    montoInput.disabled = true;

    // Preparar datos de la puja
    const pujaData = {
        autoId: autoId,
        monto: monto,
        compradorId: currentUser.id
    };

    // Enviar puja a través de WebSocket
    stompClient.send("/app/subastas/" + subastaId + "/pujar", {}, JSON.stringify(pujaData));

    // Escuchar la respuesta específica para esta puja
    const subscription = stompClient.subscribe('/user/queue/pujas', function(message) {
        try {
            const response = JSON.parse(message.body);
            
            if (response.success) {
                showSuccessToast('¡Puja realizada exitosamente!');
                // Actualizar el precio actual en el botón
                btn.dataset.precioActual = monto;
                // Actualizar el input con el nuevo monto mínimo
                montoInput.min = (monto + 1).toString();
                montoInput.value = '';
                montoInput.placeholder = `Monto mayor a $${monto.toFixed(2)}`;
                // Actualizar el texto de ayuda
                const helpText = btn.parentElement.nextElementSibling;
                if (helpText) {
                    helpText.textContent = `La puja debe ser mayor a $${monto.toFixed(2)}`;
                }
                // Recargar las subastas para ver todas las actualizaciones
                loadActiveAuctions();
            } else {
                showErrorToast(response.message || 'Error al realizar la puja');
                // Si hubo un error, permitir intentar de nuevo
                montoInput.disabled = false;
                montoInput.focus();
            }
        } catch (error) {
            console.error('Error procesando respuesta:', error);
            showErrorToast('Error al procesar la respuesta del servidor');
        }
        
        // Restaurar el botón
        btn.disabled = false;
        btn.innerHTML = originalText;
        montoInput.disabled = false;
        
        // Desuscribirse después de procesar la respuesta
        subscription.unsubscribe();
    });

    // Timeout de seguridad para restaurar el botón si no hay respuesta
    setTimeout(() => {
        if (btn.disabled) {
            btn.disabled = false;
            btn.innerHTML = originalText;
            montoInput.disabled = false;
            showErrorToast('No se recibió respuesta del servidor, intente nuevamente');
        }
    }, 5000);
}

// Funciones de subastas
function loadActiveAuctions() {
    const token = localStorage.getItem('token');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

    fetch('/api/subastas/activas', {
        headers: headers
    })
    .then(response => response.json())
    .then(subastas => {
        const subastasList = document.getElementById('subastasActivasList');
        subastasList.innerHTML = '';
        subastas.forEach(subasta => {
            const card = createAuctionCard(subasta);
            subastasList.appendChild(card);
        });
    })
    .catch(error => console.error('Error cargando subastas activas:', error));
}

// Cargar subastas activas al iniciar la página
window.addEventListener('DOMContentLoaded', function() {
    loadActiveAuctions();
});

function createAuctionCard(subasta) {
    const card = document.createElement('div');
    card.className = 'col-md-6 mb-4';
    
    let autosHtml = '';
    if (subasta.autos && subasta.autos.length > 0) {
        autosHtml = subasta.autos.map(autoSubasta => {
            if (!autoSubasta || !autoSubasta.auto) {
                console.error('AutoSubasta o Auto es undefined:', autoSubasta);
                return '';
            }

            const auto = autoSubasta.auto;
            const precioBase = auto.precioBase ? parseFloat(auto.precioBase) : 0;
            const precioFinal = autoSubasta.precioFinal ? parseFloat(autoSubasta.precioFinal) : precioBase;
            
            let pujaHtml = '';
            
            // Mostrar el botón de puja solo si:
            // 1. El usuario está autenticado
            // 2. Es un comprador
            // 3. No es el vendedor del auto
            // 4. La subasta está activa
            // 5. No está finalizada ni cancelada
            if (currentUser && 
                currentUser.tipoUsuario === 'COMPRADOR' && 
                auto.vendedor && 
                currentUser.id !== auto.vendedor.id &&
                subasta.activa &&
                !subasta.finalizada &&
                !subasta.cancelada) {
                pujaHtml = `
                    <div class="mt-2">
                        <div class="input-group">
                            <input type="number" class="form-control form-control-sm" 
                                   id="monto-${subasta.id}-${auto.id}" 
                                   placeholder="Monto de la puja"
                                   min="${precioFinal + 1}"
                                   step="0.01">
                            <button class="btn btn-success btn-sm puja-btn" 
                                    data-subasta-id="${subasta.id}" 
                                    data-auto-id="${auto.id}"
                                    data-precio-actual="${precioFinal}">
                                <i class="fas fa-gavel"></i> Pujar
                            </button>
                        </div>
                        <small class="text-muted">La puja debe ser mayor a $${precioFinal.toFixed(2)}</small>
                    </div>
                `;
            }
            
            return `
                <div class="card mb-2">
                    <div class="card-body">
                        <h6 class="card-title">${auto.marca || 'Sin marca'} ${auto.modelo || 'Sin modelo'} (${auto.anio || 'Sin año'})</h6>
                        <p class="card-text">${auto.descripcion || 'Sin descripción'}</p>
                        <div class="d-flex justify-content-between align-items-center">
                            <span class="text-primary">Precio Base: $${precioBase.toFixed(2)}</span>
                            <span class="text-success">Última Puja: $${precioFinal.toFixed(2)}</span>
                        </div>
                        ${pujaHtml}
                    </div>
                </div>
            `;
        }).join('');
    } else {
        autosHtml = '<p class="text-muted">No hay autos en esta subasta</p>';
    }

    const estado = subasta.finalizada ? 'Finalizada' : 
                   subasta.cancelada ? 'Cancelada' : 
                   !subasta.activa ? 'Inactiva' : 'Activa';
    const estadoClass = subasta.finalizada ? 'success' : 
                       subasta.cancelada ? 'danger' : 
                       !subasta.activa ? 'secondary' : 'primary';

    card.innerHTML = `
        <div class="card h-100">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="card-title mb-0">${subasta.titulo || 'Sin título'}</h5>
                <span class="badge bg-${estadoClass}">${estado}</span>
            </div>
            <div class="card-body">
                <p class="card-text">${subasta.descripcion || 'Sin descripción'}</p>
                <div class="text-muted mb-3">
                    <small>
                        <i class="fas fa-calendar-alt"></i> Inicia: ${subasta.fechaInicio ? new Date(subasta.fechaInicio).toLocaleString() : 'No definido'}<br>
                        <i class="fas fa-clock"></i> Finaliza: ${subasta.fechaFin ? new Date(subasta.fechaFin).toLocaleString() : 'No definido'}
                    </small>
                </div>
                <div class="autos-list">
                    ${autosHtml}
                </div>
            </div>
        </div>
    `;

    // Agregar event listeners a los botones de puja después de crear el card
    const pujaButtons = card.querySelectorAll('.puja-btn');
    pujaButtons.forEach(btn => {
        btn.addEventListener('click', realizarPuja);
    });

    return card;
}

function updateAuctionUI(subasta) {
    const auctionCard = document.querySelector(`#subastasList .col-md-6:nth-child(${subasta.id % 2 === 0 ? 'even' : 'odd'})`);
    if (auctionCard) {
        const pujaBtn = auctionCard.querySelector('.puja-btn');
        if (pujaBtn) {
            pujaBtn.disabled = false;
            pujaBtn.addEventListener('click', () => realizarPuja({ target: pujaBtn, dataset: { subastaId: subasta.id, autoId: subasta.auto.id } }));
        }
    }
}

// Manejo de formularios de subastas y autos
document.getElementById('crearSubastaForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    // Validaciones
    if (!formData.get('titulo') || !formData.get('descripcion') || 
        !formData.get('fechaInicio') || !formData.get('fechaFin')) {
        showErrorToast('Por favor complete todos los campos');
        return;
    }

    const fechaInicio = new Date(formData.get('fechaInicio'));
    const fechaFin = new Date(formData.get('fechaFin'));
    
    if (fechaFin <= fechaInicio) {
        showErrorToast('La fecha de fin debe ser posterior a la fecha de inicio');
        return;
    }

    // Obtener los autos seleccionados
    const autosSeleccionados = Array.from(document.querySelectorAll('.auto-select'))
        .map(select => select.value)
        .filter(value => value !== "");

    if (autosSeleccionados.length === 0) {
        showErrorToast('Debe seleccionar al menos un auto para la subasta');
        return;
    }

    // Mostrar indicador de carga
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Creando...';

    const token = localStorage.getItem('token');
    if (!token) {
        showErrorToast('No hay sesión activa');
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
        return;
    }

    fetch('/api/subastas/crear', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            titulo: formData.get('titulo'),
            descripcion: formData.get('descripcion'),
            fechaInicio: formData.get('fechaInicio'),
            fechaFin: formData.get('fechaFin'),
            autosIds: autosSeleccionados
        })
    })
    .then(response => {
        if (!response.ok) {
            return response.text().then(text => {
                throw new Error(text || 'Error al crear la subasta');
            });
        }
        return response.json();
    })
    .then(subasta => {
        showSuccessToast('Subasta creada exitosamente');
        bootstrap.Modal.getInstance(document.getElementById('crearSubastaModal')).hide();
        e.target.reset();
        loadActiveAuctions();
    })
    .catch(error => {
        console.error('Error:', error);
        showErrorToast(error.message);
    })
    .finally(() => {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    });
});

// Cargar autos disponibles al abrir el modal de crear subasta
document.getElementById('crearSubastaModal').addEventListener('show.bs.modal', function() {
    loadAutosDisponibles();
});

// Agregar botón para más autos
document.getElementById('agregarAutoBtn').addEventListener('click', function() {
    const container = document.getElementById('autosContainer');
    const newSelectContainer = document.createElement('div');
    newSelectContainer.className = 'auto-select-container mb-2 d-flex';
    newSelectContainer.innerHTML = `
        <select class="form-select auto-select me-2" required>
            <option value="">Seleccione un auto...</option>
        </select>
        <button type="button" class="btn btn-outline-danger btn-sm" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    container.appendChild(newSelectContainer);
    loadAutosDisponibles();
});

// Cargar autos disponibles
function loadAutosDisponibles() {
    const token = localStorage.getItem('token');
    if (!token) {
        console.error('No hay token disponible');
        return;
    }

    fetch('/api/autos/vendedor', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        if (!response.ok) {
            if (response.status === 403) {
                throw new Error('No tiene permisos para ver los autos');
            }
            return response.text().then(text => {
                throw new Error(text || 'Error al cargar los autos disponibles');
            });
        }
        return response.json();
    })
    .then(autos => {
        document.querySelectorAll('.auto-select').forEach(select => {
            const selectedValue = select.value;
            select.innerHTML = '<option value="">Seleccione un auto...</option>';
            if (autos && autos.length > 0) {
                autos.forEach(auto => {
                    if (!auto.vendido) {
                        const option = document.createElement('option');
                        option.value = auto.id;
                        option.textContent = `${auto.marca} ${auto.modelo} (${auto.anio}) - $${auto.precioBase}`;
                        select.appendChild(option);
                    }
                });
                if (selectedValue) {
                    select.value = selectedValue;
                }
            }
        });
    })
    .catch(error => {
        console.error('Error cargando autos:', error);
        showErrorToast(error.message || 'Error al cargar los autos disponibles');
        document.querySelectorAll('.auto-select').forEach(select => {
            select.innerHTML = '<option value="">Error al cargar autos</option>';
        });
    });
}

// Cargar subastas del vendedor
function loadVendedorSubastas() {
    const token = localStorage.getItem('token');
    if (!token) return;

    fetch('/api/subastas/vendedor', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        if (!response.ok) {
            return response.text().then(text => {
                throw new Error(text || 'Error al cargar las subastas');
            });
        }
        return response.json();
    })
    .then(subastas => {
        const subastasList = document.getElementById('misSubastasList');
        if (subastasList) {
            subastasList.innerHTML = '';
            if (subastas && subastas.length > 0) {
                subastas.forEach(subasta => {
                    const card = createAuctionCard(subasta);
                    subastasList.appendChild(card);
                });
            } else {
                subastasList.innerHTML = '<div class="col-12"><p class="text-muted">No tiene subastas creadas</p></div>';
            }
        }
    })
    .catch(error => {
        console.error('Error cargando subastas del vendedor:', error);
        showErrorToast(error.message || 'Error al cargar las subastas del vendedor');
    });
}

// Función para crear tarjeta de auto
function createAutoCard(auto) {
    const card = document.createElement('div');
    card.className = 'col-md-4 mb-4';
    
    let estadoBtn = '';
    if (auto.vendido) {
        estadoBtn = '<span class="badge bg-success">Vendido</span>';
    } else if (auto.enSubasta) {
        estadoBtn = '<span class="badge bg-warning">En Subasta</span>';
    } else {
        estadoBtn = '<span class="badge bg-primary">Disponible</span>';
    }
    
    card.innerHTML = `
        <div class="card h-100">
            <div class="card-body">
                <h5 class="card-title">${auto.marca} ${auto.modelo}</h5>
                <p class="card-text">
                    <strong>Año:</strong> ${auto.anio}<br>
                    <strong>Precio Base:</strong> $${auto.precioBase.toFixed(2)}<br>
                    <strong>Estado:</strong> ${auto.vendido ? 'Vendido' : (auto.enSubasta ? 'En Subasta' : 'Disponible')}
                </p>
                <p class="card-text">${auto.descripcion}</p>
                ${estadoBtn}
            </div>
        </div>
    `;
    
    return card;
}

// Función para agregar auto a nueva subasta
function agregarAutoANuevaSubasta(autoId) {
    const modal = new bootstrap.Modal(document.getElementById('crearSubastaModal'));
    const autoSelect = document.querySelector('.auto-select');
    if (autoSelect) {
        autoSelect.value = autoId;
    }
    modal.show();
}

// Cargar autos del vendedor
function loadVendedorAutos() {
    const token = localStorage.getItem('token');
    if (!token) {
        console.error('No hay token disponible');
        return;
    }

    fetch('/api/autos/vendedor', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        if (!response.ok) {
            if (response.status === 403) {
                throw new Error('No tiene permisos para ver los autos');
            }
            return response.text().then(text => {
                throw new Error(text || 'Error al cargar los autos');
            });
        }
        return response.json();
    })
    .then(autos => {
        const autosList = document.getElementById('misAutosList');
        if (autosList) {
            autosList.innerHTML = '';
            if (autos && autos.length > 0) {
                autos.forEach(auto => {
                    const card = createAutoCard(auto);
                    autosList.appendChild(card);
                });
            } else {
                autosList.innerHTML = '<div class="col-12"><p class="text-muted">No tiene autos registrados</p></div>';
            }
        }
    })
    .catch(error => {
        console.error('Error cargando autos del vendedor:', error);
        showErrorToast(error.message || 'Error al cargar los autos');
        const autosList = document.getElementById('misAutosList');
        if (autosList) {
            autosList.innerHTML = '<div class="col-12"><p class="text-danger">Error al cargar los autos</p></div>';
        }
    });
}

// Verificar estado de subastas periódicamente
function checkAuctionsStatus() {
    const token = localStorage.getItem('token');
    if (!token) return;

    fetch('/api/subastas/activas', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(subastas => {
        subastas.forEach(subasta => {
            const fechaFin = new Date(subasta.fechaFin);
            if (fechaFin <= new Date() && subasta.activa) {
                fetch(`/api/subastas/${subasta.id}/finalizar`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                })
                .then(() => {
                    loadActiveAuctions();
                    loadVendedorSubastas();
                    loadVendedorAutos();
                })
                .catch(error => console.error('Error finalizando subasta:', error));
            }
        });
    })
    .catch(error => console.error('Error verificando estado de subastas:', error));
}

// Iniciar verificación periódica de subastas
setInterval(checkAuctionsStatus, 60000); // Verificar cada minuto

// Funciones de administración
function loadUsersList() {
    const token = localStorage.getItem('token');
    if (!token) return;

    fetch('/api/admin/usuarios', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('No tiene permisos de administrador');
        }
        return response.json();
    })
    .then(usuarios => {
        const usersListContainer = document.getElementById('usersListContainer');
        if (usersListContainer) {
            // Crear la tabla
            usersListContainer.innerHTML = `
                <div class="table-responsive">
                    <table class="table table-striped">
                        <thead>
                            <tr>
                                <th>Usuario</th>
                                <th>Nombre</th>
                                <th>Email</th>
                                <th>Tipo</th>
                                <th>Estado</th>
                                <th>Bloqueo</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody id="adminUsersList">
                        </tbody>
                    </table>
                </div>
            `;

            const usersList = document.getElementById('adminUsersList');
            usuarios.forEach(usuario => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${usuario.username}</td>
                    <td>${usuario.nombre} ${usuario.apellido}</td>
                    <td>${usuario.email}</td>
                    <td>${usuario.tipoUsuario}</td>
                    <td>
                        <span class="badge bg-${usuario.activo ? 'success' : 'danger'}">
                            ${usuario.activo ? 'Activo' : 'Inactivo'}
                        </span>
                    </td>
                    <td>
                        <span class="badge bg-${usuario.bloqueado ? 'danger' : 'success'}">
                            ${usuario.bloqueado ? 'Bloqueado' : 'Desbloqueado'}
                        </span>
                    </td>
                    <td>
                        <button class="btn btn-sm btn-${usuario.activo ? 'danger' : 'success'}"
                                onclick="toggleUserStatus(${usuario.id}, ${usuario.activo})">
                            ${usuario.activo ? 'Desactivar' : 'Activar'}
                        </button>
                    </td>
                `;
                usersList.appendChild(row);
            });
        }
    })
    .catch(error => {
        console.error('Error cargando usuarios:', error);
        showErrorToast(error.message);
    });
}

function toggleUserStatus(userId, isActive) {
    const token = localStorage.getItem('token');
    if (!token) return;

    const action = isActive ? 'desactivar' : 'activar';
    fetch(`/api/admin/usuarios/${userId}/${action}`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Error al cambiar el estado del usuario');
        }
        return response.json();
    })
    .then(() => {
        showSuccessToast(`Usuario ${action}do exitosamente`);
        loadUsersList();
    })
    .catch(error => {
        console.error('Error:', error);
        showErrorToast(error.message);
    });
}