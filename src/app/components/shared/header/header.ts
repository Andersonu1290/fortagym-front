import { Component, OnInit, HostListener, OnDestroy } from '@angular/core';
import { RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';
import { environment } from '../../../../environments/environment';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './header.html',
  styleUrls: ['./header.scss']
})
export class HeaderComponent implements OnInit, OnDestroy {
  usuarioLogueado: boolean = false;
  nombreUsuario: string = '';
  fotoPreviewUrl: string = 'assets/img/user-icon.png';
  rutaPanel: string = '/';
  menuAbierto: boolean = false;

  // 🛒 Variable lista para el HTML (inicializada en 0 temporalmente)
  cantidadTotal: number = 0;

  nombreMembresia: string | null = null;
  colorMembresia: string = '';

  private routerSub!: Subscription;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.verificarSesion();

    // 🚀 LA MAGIA: Escuchamos cada vez que la URL cambia para actualizar el Header
    this.routerSub = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.verificarSesion();
    });
  }

  ngOnDestroy(): void {
    // Limpiamos la suscripción si el componente se destruye
    if (this.routerSub) {
      this.routerSub.unsubscribe();
    }
  }

  verificarSesion() {
    const estadoAnterior = this.usuarioLogueado;
    this.usuarioLogueado = this.authService.isLoggedIn();

    if (this.usuarioLogueado) {
      this.authService.getPerfil().subscribe({
        next: (data: any) => {
          this.nombreUsuario = data.nombre;
          this.fotoPreviewUrl = `${environment.apiUrl}/api/usuarios/foto/${data.id}?t=${Date.now()}`;

          // 🔥 NUEVO: LÓGICA PARA DETECTAR LA MEMBRESÍA
          if (data.membresiaActiva && data.membresiaActiva.tipo) {
            this.nombreMembresia = data.membresiaActiva.tipo;
            // Si el nombre tiene la palabra "black", usamos el estilo oscuro, si no el naranja
            this.colorMembresia = this.nombreMembresia?.toLowerCase().includes('black') ? 'badge-black' : 'badge-orange';
          } else {
            this.nombreMembresia = null;
          }

          if (data.rol === 'ADMIN') this.rutaPanel = '/admin/dashboard';
          else if (data.rol === 'ENTRENADOR') this.rutaPanel = '/entrenador/dashboard';
          else if (data.rol === 'NUTRICIONISTA') this.rutaPanel = '/nutricion/dashboard';
          else this.rutaPanel = '/mis-planes'; // Usuario normal
        },
        error: () => {
          this.cerrarSesion(); // Si el token falló o caducó, limpiamos todo
        }
      });
    } else if (estadoAnterior !== this.usuarioLogueado) {
      // Limpiar datos visuales si se cerró sesión
      this.nombreUsuario = '';
      this.fotoPreviewUrl = 'assets/img/user-icon.png';
    }
  }

  toggleMenu(event: Event) {
    event.stopPropagation();
    this.menuAbierto = !this.menuAbierto;
  }

  // 🖱️ Cierra el menú flotante si haces clic en cualquier otra parte de la pantalla
  @HostListener('document:click')
  cerrarMenu() {
    this.menuAbierto = false;
  }

  cerrarSesion(): void {
    this.authService.logout();
    this.usuarioLogueado = false;
    this.menuAbierto = false;
    this.router.navigate(['/login']);
  }
}
