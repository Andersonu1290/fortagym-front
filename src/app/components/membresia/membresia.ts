import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface Feature {
  nombre: string;
  incluido: boolean;
}

export interface PlanMembresia {
  id: number;
  nombre: string;
  descripcion: string;
  fidelidad: string;
  precio: number;
  recomendado: boolean;
  colorBoton?: string;
  features: Feature[];
}

@Component({
  selector: 'app-membresia',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './membresia.html',
  styleUrls: ['./membresia.scss']
})
export class MembresiaComponent implements OnInit {

  private apiUrl = `${environment.apiUrl}/api/pagos/confirmar`;

  pasoActual: number = 1;
  planes: PlanMembresia[] = [];
  planSeleccionado!: PlanMembresia;
  metodoPago: 'tarjeta' | 'yape' = 'tarjeta';
  terminosAceptados: boolean = false;
  cargandoDatos: boolean = true;

  // ── Campos del formulario ──────────────────────────────────────────────────
  nombre        = '';
  apellido      = '';
  dni           = '';
  telefono      = '';
  email         = '';

  // Tarjeta
  numTarjeta    = '';
  titular       = '';
  vencimiento   = '';
  cvv           = '';

  // Yape
  telefonoYape  = '';

  // ── Errores ────────────────────────────────────────────────────────────────
  errores: Record<string, string> = {};

  // ── Regexes ───────────────────────────────────────────────────────────────
  private readonly SOLO_LETRAS   = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
  private readonly EMAIL_RE      = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.planes = [
      {
        id: 1,
        nombre: 'Plan Black',
        descripcion: 'El pase VIP absoluto',
        fidelidad: '12 MESES DE FIDELIDAD',
        precio: 119.90,
        recomendado: true,
        colorBoton: 'black-btn',
        features: [
          { nombre: '<strong>Entrena en todas las sedes</strong> a nivel nacional e internacional', incluido: true },
          { nombre: 'Acceso ilimitado a áreas de musculación y cardio', incluido: true },
          { nombre: 'Clases grupales premium ilimitadas', incluido: true },
          { nombre: 'FortaGym App con rutinas 3D', incluido: true },
          { nombre: 'Sillones de masajes post-entreno', incluido: true },
          { nombre: '<strong>5 invitados VIP al mes</strong>', incluido: true }
        ]
      },
      {
        id: 2,
        nombre: 'Plan Fit',
        descripcion: 'Resultados constantes',
        fidelidad: '12 MESES DE FIDELIDAD',
        precio: 89.90,
        recomendado: false,
        colorBoton: 'orange-btn',
        features: [
          { nombre: 'Entrena en tu gimnasio de elección', incluido: true },
          { nombre: 'Acceso ilimitado a áreas de musculación y cardio', incluido: true },
          { nombre: 'Clases grupales con profesores en vivo', incluido: true },
          { nombre: 'FortaGym App con seguimiento', incluido: true },
          { nombre: 'Sillones de masajes post-entreno', incluido: false },
          { nombre: 'Invitados VIP al mes', incluido: false }
        ]
      },
      {
        id: 3,
        nombre: 'Plan Smart',
        descripcion: 'Libertad total',
        fidelidad: 'SIN FIDELIDAD (CANCELA CUANDO QUIERAS)',
        precio: 99.90,
        recomendado: false,
        colorBoton: 'orange-btn',
        features: [
          { nombre: 'Entrena en tu gimnasio de elección', incluido: true },
          { nombre: 'Acceso ilimitado a áreas de musculación y cardio', incluido: true },
          { nombre: 'Clases grupales con profesores en vivo', incluido: true },
          { nombre: 'FortaGym App con seguimiento', incluido: true },
          { nombre: 'Sillones de masajes post-entreno', incluido: false },
          { nombre: 'Invitados VIP al mes', incluido: false }
        ]
      }
    ];

    this.planSeleccionado = this.planes[0];
    this.cargarDatosUsuario();
  }

  // ── Selección de plan ──────────────────────────────────────────────────────
  seleccionarPlan(plan: PlanMembresia): void {
    this.planSeleccionado = plan;
  }

  esPlanSeleccionado(plan: PlanMembresia): boolean {
    return this.planSeleccionado?.id === plan.id;
  }

  // ── Cálculos ───────────────────────────────────────────────────────────────
  calcularIGV(): number {
    return this.planSeleccionado.precio * 0.18;
  }

  calcularTotal(): number {
    return this.planSeleccionado.precio + this.calcularIGV();
  }

  // ── Navegación ─────────────────────────────────────────────────────────────
  irPaso(paso: number): void {
    if (paso === 2 && !this.planSeleccionado) return;
    this.pasoActual = paso;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  FORMATEO AUTOMÁTICO DE INPUTS
  // ══════════════════════════════════════════════════════════════════════════

  /** Solo letras (nombre / apellido / titular) */
  onSoloLetras(event: Event, campo: 'nombre' | 'apellido' | 'titular'): void {
    const input = event.target as HTMLInputElement;
    // Eliminar cualquier carácter que no sea letra o espacio
    const limpio = input.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
    this[campo] = limpio;
    input.value  = limpio;
  }

  /** DNI: solo 8 dígitos */
  onDni(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digitos = input.value.replace(/\D/g, '').slice(0, 8);
    this.dni   = digitos;
    input.value = digitos;
  }

  /**
   * Teléfono: +51 999 999 999
   * El prefijo +51 se muestra siempre; el usuario solo escribe los 9 dígitos.
   */
  onTelefono(event: Event, campo: 'telefono' | 'telefonoYape'): void {
    const input = event.target as HTMLInputElement;

    // 1. Obtenemos solo los números, ignorando el prefijo "+51 "
    let rawValue = input.value.replace('+51 ', '').replace(/\D/g, '');

    // 2. Limitamos a máximo 9 dígitos
    rawValue = rawValue.substring(0, 9);

    // 3. Formateamos: 999 999 999
    let formatted = '';
    if (rawValue.length > 0) {
      formatted = rawValue.substring(0, 3);
      if (rawValue.length > 3) formatted += ' ' + rawValue.substring(3, 6);
      if (rawValue.length > 6) formatted += ' ' + rawValue.substring(6, 9);
    }

    // 4. Construimos el valor final con el prefijo
    const finalValue = rawValue.length > 0 ? '+51 ' + formatted : '';

    // 5. ACTUALIZACIÓN SEGURA:
    // Actualizamos la variable del componente
    this[campo] = finalValue;

    // Solo actualizamos el DOM si el valor es diferente para evitar el parpadeo/loop
    if (input.value !== finalValue) {
      input.value = finalValue;
    }
  }

  /** Coloca el cursor al final si el usuario hace click cuando el campo tiene +51 */
  onTelefonoFocus(event: FocusEvent): void {
    const input = event.target as HTMLInputElement;
    if (!input.value) {
      input.value = '+51 ';
      this.telefono = '+51 ';
    }
    // Mover cursor al final
    setTimeout(() => input.setSelectionRange(input.value.length, input.value.length), 0);
  }

  onTelefonoYapeFocus(event: FocusEvent): void {
    const input = event.target as HTMLInputElement;
    if (!input.value) {
      input.value = '+51 ';
      this.telefonoYape = '+51 ';
    }
    setTimeout(() => input.setSelectionRange(input.value.length, input.value.length), 0);
  }

  /** Número de tarjeta: 0000 0000 0000 0000 */
  onNumTarjeta(event: Event): void {
    const input   = event.target as HTMLInputElement;
    const digitos = input.value.replace(/\D/g, '').slice(0, 16);

    // Grupos de 4
    const grupos = digitos.match(/.{1,4}/g) ?? [];
    const formateado = grupos.join(' ');

    this.numTarjeta = formateado;
    input.value      = formateado;
  }

  /** Vencimiento: MM/AA */
  onVencimiento(event: Event): void {
    const input   = event.target as HTMLInputElement;
    let digitos   = input.value.replace(/\D/g, '').slice(0, 4);

    let formateado = digitos;

    if (digitos.length >= 2) {
      // Validar mes (01-12)
      let mes = parseInt(digitos.slice(0, 2), 10);
      if (mes > 12) mes = 12;
      if (mes < 1 && digitos.length === 2) mes = 1;
      const mesStr = mes.toString().padStart(2, '0');
      formateado = mesStr + (digitos.length > 2 ? '/' + digitos.slice(2) : '');
    }

    this.vencimiento = formateado;
    input.value       = formateado;
  }

  /** CVV: 3-4 dígitos */
  onCvv(event: Event): void {
    const input   = event.target as HTMLInputElement;
    const digitos = input.value.replace(/\D/g, '').slice(0, 4);
    this.cvv    = digitos;
    input.value  = digitos;
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  VALIDACIÓN COMPLETA
  // ══════════════════════════════════════════════════════════════════════════

  private validarFormulario(): boolean {
    this.errores = {};

    // Datos personales
    if (!this.nombre.trim())
      this.errores['nombre'] = 'El nombre es obligatorio.';
    else if (!this.SOLO_LETRAS.test(this.nombre))
      this.errores['nombre'] = 'Solo se permiten letras.';

    if (!this.apellido.trim())
      this.errores['apellido'] = 'El apellido es obligatorio.';
    else if (!this.SOLO_LETRAS.test(this.apellido))
      this.errores['apellido'] = 'Solo se permiten letras.';

    if (!this.dni.trim())
      this.errores['dni'] = 'El DNI es obligatorio.';
    else if (this.dni.length !== 8)
      this.errores['dni'] = 'El DNI debe tener 8 dígitos.';

    const telefonoDigitos = this.telefono.replace(/\D/g, '');
    if (!this.telefono || telefonoDigitos.length < 11)   // 51 + 9 dígitos
      this.errores['telefono'] = 'Ingresa un teléfono válido (+51 999 999 999).';

    if (!this.email.trim())
      this.errores['email'] = 'El correo es obligatorio.';
    else if (!this.EMAIL_RE.test(this.email))
      this.errores['email'] = 'Ingresa un correo válido.';

    // Pago
    if (this.metodoPago === 'tarjeta') {
      const cardDigitos = this.numTarjeta.replace(/\D/g, '');
      if (cardDigitos.length !== 16)
        this.errores['numTarjeta'] = 'La tarjeta debe tener 16 dígitos.';

      if (!this.titular.trim())
        this.errores['titular'] = 'El nombre del titular es obligatorio.';
      else if (!this.SOLO_LETRAS.test(this.titular))
        this.errores['titular'] = 'Solo se permiten letras.';

      if (this.vencimiento.length < 5)
        this.errores['vencimiento'] = 'Ingresa una fecha válida (MM/AA).';
      else {
        const [mm, aa] = this.vencimiento.split('/').map(Number);
        const ahora = new Date();
        const anioActual = ahora.getFullYear() % 100;
        const mesActual  = ahora.getMonth() + 1;
        if (aa < anioActual || (aa === anioActual && mm < mesActual))
          this.errores['vencimiento'] = 'La tarjeta está vencida.';
      }

      if (this.cvv.length < 3)
        this.errores['cvv'] = 'El CVV debe tener 3 o 4 dígitos.';

    } else {
      const yapeDig = this.telefonoYape.replace(/\D/g, '');
      if (yapeDig.length < 11)
        this.errores['telefonoYape'] = 'Ingresa un número válido (+51 999 999 999).';
    }

    if (!this.terminosAceptados)
      this.errores['terminos'] = 'Debes aceptar los términos y condiciones.';

    return Object.keys(this.errores).length === 0;
  }

  procesarPago(): void {
    if (!this.validarFormulario()) return;

    // 1. Preparamos los datos tal como los espera PagoRequest en Java
    // Usamos los últimos 4 dígitos de la tarjeta o el número de Yape como "numeroOperacion"
    const operacionRef = this.metodoPago === 'tarjeta'
                         ? 'TARJETA-FIN-' + this.numTarjeta.slice(-4)
                         : 'YAPE-' + this.telefonoYape.replace(/\D/g, '');

    const payload = {
      numeroOperacion: operacionRef,
      metodoPago: this.metodoPago,
      membresiaId: this.planSeleccionado.id
    };

    // 2. Obtenemos el token JWT del usuario logueado (Asegúrate de que la key sea la correcta, ej: 'token')
    const token = localStorage.getItem('token');

    // Si no hay token, significa que no ha iniciado sesión
    if (!token) {
      alert("Debes iniciar sesión para comprar una membresía.");
      return;
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    // 3. Enviamos la petición al backend
    this.http.post(this.apiUrl, payload, { headers })
      .subscribe({
        next: (respuesta: any) => {
          console.log('Pago registrado exitosamente en la BD:', respuesta);
          // Solo si el backend responde con éxito (200 OK), pasamos a la pantalla de confirmación
          this.irPaso(3);
        },
        error: (error) => {
          console.error('Error al procesar el pago:', error);
          alert('Hubo un error al procesar tu pago. Revisa la consola.');
        }
      });
  }

  cargarDatosUsuario(): void {
    setTimeout(() => {
      this.http.get<any>(`${environment.apiUrl}/api/usuarios/perfil`).subscribe({
        next: (usuario) => {
          this.nombre   = usuario.nombre || '';
          this.apellido = usuario.apellido || '';
          this.email    = usuario.email || '';
          this.dni      = usuario.dni || '';
          this.telefono = usuario.telefono || '';
          this.cargandoDatos = false;
        },
        error: (err) => {
          console.error('Error al cargar datos:', err);
          this.cargandoDatos = false;
        }
      });
    }, 800);
  }
}
