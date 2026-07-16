import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CartService, ProductoCarrito } from '../../../services/cart.service';
import { environment } from '../../../../environments/environment';
import { Subject, takeUntil } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-compra',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './compra.html',
  styleUrls: ['./compra.scss']
})
export class CompraComponent implements OnInit, OnDestroy {

  public readonly ApiUrl = environment.apiUrl;
  private destroy$ = new Subject<void>();

  checkoutForm!: FormGroup;
  vistaActual: 'compra' | 'confirmacion' = 'compra';
  confirmacionData: any = null;
  cargandoDatos: boolean = true;

  // Variables de confirmación
  numeroOrden: string = '';
  fechaActual: Date = new Date();
  carritoConfirmado: ProductoCarrito[] = [];
  subtotalConfirmado: number = 0;
  descuentoConfirmado: number = 0;
  igvConfirmado: number = 0;
  totalConfirmado: number = 0;

  shipCost: number = 0;
  couponCode: string = '';
  hasDsc: boolean = false;
  discountPercentage: number = 0.10;

  // 🔥 BASE DE DATOS DE UBICACIONES (UBIGEO)
  ubicacionesPeru: any = {
    'Lima': {
      'Lima': ['Ancón', 'Ate', 'Barranco', 'Breña', 'Carabayllo', 'Chaclacayo', 'Chorrillos', 'Cieneguilla', 'Comas', 'El Agustino', 'Independencia', 'Jesús María', 'La Molina', 'La Victoria', 'Lince', 'Los Olivos', 'Lurigancho', 'Lurín', 'Magdalena del Mar', 'Miraflores', 'Pachacámac', 'Pucusana', 'Pueblo Libre', 'Puente Piedra', 'Punta Hermosa', 'Punta Negra', 'Rímac', 'San Bartolo', 'San Borja', 'San Isidro', 'San Juan de Lurigancho', 'San Juan de Miraflores', 'San Luis', 'San Martín de Porres', 'San Miguel', 'Santa Anita', 'Santa María del Mar', 'Santa Rosa', 'Santiago de Surco', 'Surquillo', 'Villa El Salvador', 'Villa María del Triunfo'],
      'Cañete': ['Asia', 'Chilca', 'Mala', 'San Vicente de Cañete'],
      'Huaral': ['Huaral', 'Aucallama', 'Chancay']
    },
    'Callao': {
      'Callao': ['Bellavista', 'Callao', 'Carmen de la Legua', 'La Perla', 'La Punta', 'Ventanilla', 'Mi Perú']
    },
    'Arequipa': {
      'Arequipa': ['Alto Selva Alegre', 'Arequipa', 'Cayma', 'Cerro Colorado', 'Jacobo Hunter', 'José Luis Bustamante y Rivero', 'Mariano Melgar', 'Miraflores', 'Paucarpata', 'Sabandía', 'Sachaca', 'Socabaya', 'Tiabaya', 'Umacollo', 'Yanahuara', 'Yura']
    },
    'Cusco': {
      'Cusco': ['Cusco', 'Ccorca', 'Poroy', 'San Jerónimo', 'San Sebastián', 'Santiago', 'Saylla', 'Wanchaq'],
      'Urubamba': ['Chinchero', 'Machupicchu', 'Maras', 'Ollantaytambo', 'Urubamba']
    },
    'La Libertad': {
      'Trujillo': ['Trujillo', 'El Porvenir', 'Florencia de Mora', 'Huanchaco', 'La Esperanza', 'Laredo', 'Moche', 'Salaverry', 'Víctor Larco Herrera']
    }
  };

  // 🔥 SEDES DE FORTAGYM
  sedesFortaGym = [
    { id: 'puente_piedra', nombre: 'Sede Puente Piedra', direccion: 'Av. Puente Piedra 1126 (Paradero Norteño)', distrito: 'Puente Piedra', provincia: 'Lima', departamento: 'Lima' },
    { id: 'santa_clara', nombre: 'Sede Santa Clara', direccion: 'Multicentro Santa Clara, 3er nivel', distrito: 'Ate', provincia: 'Lima', departamento: 'Lima' },
    { id: 'ventanilla', nombre: 'Sede Ventanilla', direccion: 'Mz. D Lt. 1, 2do piso, Villa Los Reyes 1era etapa', distrito: 'Ventanilla', provincia: 'Callao', departamento: 'Callao' }
  ];

  // Listas dinámicas para los Selects
  listaDepartamentos: string[] = [];
  listaProvincias: string[] = [];
  listaDistritos: string[] = [];

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private cartService: CartService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.listaDepartamentos = Object.keys(this.ubicacionesPeru);

    this.checkoutForm = this.fb.group({
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      dni: ['', [Validators.required, Validators.pattern('^[0-9]{8}$')]],
      telefono: ['', Validators.required],
      correo: ['', [Validators.required, Validators.email]],
      departamento: ['', Validators.required],
      provincia: ['', Validators.required],
      distrito: ['', Validators.required],
      codigoPostal: [''],
      direccion: ['', Validators.required],
      referencia: [''],
      metodoEntrega: ['domicilio', Validators.required],
      sedeSeleccionada: ['puente_piedra', Validators.required],
      metodoPago: ['tarjeta', Validators.required],

      // Datos Tarjeta
      numeroTarjeta: [''], nombreTarjeta: [''], vencimiento: [''], cvv: [''], guardarTarjeta: [false],
      // Datos Transferencia/Yape
      numeroOperacion: [''],
      aceptarTerminos: [false, Validators.requiredTrue]
    });

    this.cargarDatosUsuario();
    this.escucharCambiosUbicacion();
    this.escucharMetodoEntrega();
  }

  // 🔥 LÓGICA PARA OCULTAR/MOSTRAR DIRECCIÓN SEGÚN MÉTODO DE ENTREGA
  escucharMetodoEntrega(): void {
    this.checkoutForm.get('metodoEntrega')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(metodo => {
      const camposDireccion = ['departamento', 'provincia', 'distrito', 'direccion'];

      if (metodo === 'sede') {
        // Si es recojo en sede, la dirección NO es obligatoria
        camposDireccion.forEach(campo => {
          this.checkoutForm.get(campo)?.clearValidators();
          this.checkoutForm.get(campo)?.updateValueAndValidity();
        });
      } else {
        // Si es delivery, vuelve a ser obligatoria
        camposDireccion.forEach(campo => {
          this.checkoutForm.get(campo)?.setValidators(Validators.required);
          this.checkoutForm.get(campo)?.updateValueAndValidity();
        });
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // 🔥 LÓGICA DE CASCADA PARA EL UBIGEO
  escucharCambiosUbicacion(): void {
    // Cuando cambia el Departamento
    this.checkoutForm.get('departamento')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(dep => {
      this.listaProvincias = dep ? Object.keys(this.ubicacionesPeru[dep]) : [];
      this.checkoutForm.patchValue({ provincia: '', distrito: '' }, { emitEvent: false });
      this.listaDistritos = [];
    });

    // Cuando cambia la Provincia
    this.checkoutForm.get('provincia')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(prov => {
      const dep = this.checkoutForm.get('departamento')?.value;
      this.listaDistritos = (dep && prov) ? this.ubicacionesPeru[dep][prov] : [];
      this.checkoutForm.patchValue({ distrito: '' }, { emitEvent: false });
    });
  }

  cargarDatosUsuario(): void {
    setTimeout(() => {
      this.http.get<any>(`${this.ApiUrl}/api/usuarios/perfil`).subscribe({
        next: (usuario) => {
          this.checkoutForm.patchValue({
            nombre: usuario.nombre || '',
            apellido: usuario.apellido || '',
            correo: usuario.email || '',
            dni: usuario.dni || '',
            telefono: usuario.telefono || ''
          });
          this.cargandoDatos = false;
        },
        error: () => this.cargandoDatos = false
      });
    }, 800);
  }

  // --- LÓGICA DE TARJETA ---
  formatCardNumber(event: any): void {
    let input = event.target.value.replace(/\D/g, '').substring(0, 16);
    this.checkoutForm.patchValue({ numeroTarjeta: input.replace(/(\d{4})(?=\d)/g, '$1 ') }, { emitEvent: false });
  }
  formatExpiry(event: any): void {
    let input = event.target.value.replace(/\D/g, '').substring(0, 4);
    if (input.length > 2) input = input.substring(0, 2) + '/' + input.substring(2);
    this.checkoutForm.patchValue({ vencimiento: input }, { emitEvent: false });
  }
  formatCVV(event: any): void {
    this.checkoutForm.patchValue({ cvv: event.target.value.replace(/\D/g, '').substring(0, 4) }, { emitEvent: false });
  }

  // --- GETTERS ---
  get carrito(): ProductoCarrito[] { return this.cartService.getCarrito(); }
  get qty(): number { return this.carrito.reduce((acc, item) => acc + item.cantidad, 0); }
  get subtotal(): number { return this.cartService.getSubtotal(); }
  get discountAmount(): number { return this.hasDsc ? this.subtotal * this.discountPercentage : 0; }
  get total(): number { return (this.subtotal - this.discountAmount) + this.shipCost; }
  get igv(): number { return this.total - (this.total / 1.18); }

  chQty(item: ProductoCarrito, delta: number): void {
    const nueva = item.cantidad + delta;
    if (nueva >= 1 && nueva <= 99) this.cartService.actualizarCantidadExacta(item.id, nueva);
  }
  applyCoupon(): void { this.hasDsc = (this.couponCode.trim().toUpperCase() === 'FORTA10'); }
  selDel(cost: number): void { this.shipCost = cost; }
  resolverImg(img: string): string { return (!img) ? 'assets/images/producto-placeholder.png' : (img.startsWith('http') ? img : `${this.ApiUrl}${img}`); }

  // 🔥 CONFIRMAR PEDIDO
  confirmarPedido(): void {
    if (this.checkoutForm.valid && this.carrito.length > 0) {
      // 🔥 Lógica dinámica: Si es sede, extraemos los datos de la sede elegida
      const esSede = this.checkoutForm.value.metodoEntrega === 'sede';
      let depFinal = this.checkoutForm.value.departamento;
      let provFinal = this.checkoutForm.value.provincia;
      let distFinal = this.checkoutForm.value.distrito;
      let dirFinal = this.checkoutForm.value.direccion;
      let refFinal = this.checkoutForm.value.referencia;
      let cpFinal = this.checkoutForm.value.codigoPostal;

      if (esSede) {
        const sedeElegida = this.sedesFortaGym.find(s => s.id === this.checkoutForm.value.sedeSeleccionada);
        if (sedeElegida) {
          depFinal = sedeElegida.departamento;
          provFinal = sedeElegida.provincia;
          distFinal = sedeElegida.distrito;
          dirFinal = `RECOJO PRESENCIAL: ${sedeElegida.nombre} - ${sedeElegida.direccion}`;
          refFinal = 'Cliente recogerá en mostrador';
          cpFinal = '';
        }
      }

      const payload = {
        departamento: depFinal,
        provincia: provFinal,
        distrito: distFinal,
        direccion: dirFinal,
        codigoPostal: cpFinal,
        referencia: refFinal,
        metodoEntrega: this.checkoutForm.value.metodoEntrega,
        metodoPago: this.checkoutForm.value.metodoPago,
        codigoCupon: this.hasDsc ? this.couponCode : null,
        items: this.carrito.map(item => ({ productoId: item.id, cantidad: item.cantidad }))
      };

      this.http.post<any>(`${this.ApiUrl}/api/tienda/checkout`, payload).subscribe({
        next: (res) => {
          this.confirmacionData = res;
          // 🔥 Asignamos el número de orden que devuelve tu Backend
          this.numeroOrden = res.numeroOrden || `ORD-${Math.floor(Math.random() * 100000)}`;
          this.fechaActual = new Date();
          this.carritoConfirmado = [...this.carrito];
          this.subtotalConfirmado = this.subtotal;
          this.descuentoConfirmado = this.discountAmount;
          this.igvConfirmado = this.igv;
          this.totalConfirmado = this.total;
          this.vistaActual = 'confirmacion';

          this.cartService.limpiarCarrito();
          window.scrollTo(0, 0);
        },
        error: (err) => alert('Error: ' + (err.error?.message || 'Revisa tu conexión'))
      });
    } else {
      if (this.carrito.length === 0) alert('Tu carrito está vacío.');
      else {
        this.checkoutForm.markAllAsTouched();
        alert('Por favor, completa correctamente todos los campos obligatorios.');
      }
    }
  }

  // 🔥 Mostrar dirección en la pantalla de éxito
  obtenerDireccionSedeConfirmacion(): string {
    const id = this.checkoutForm.get('sedeSeleccionada')?.value;
    const sede = this.sedesFortaGym.find(s => s.id === id);
    if (sede) return `RECOJO PRESENCIAL: ${sede.nombre}, ${sede.direccion}, ${sede.distrito}`;
    return 'RECOJO PRESENCIAL';
  }

  volverAlCarrito(): void { this.vistaActual = 'compra'; }

  // 🔥 Nuevas funciones de navegación para la pantalla de éxito
  irAHistorialCompras(): void {
    this.router.navigate(['/historial-compras']);
  }

  irATienda(): void {
    this.router.navigate(['/tienda']);
  }
}
