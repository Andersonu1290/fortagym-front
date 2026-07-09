import { Routes } from '@angular/router';
import { Login } from './components/auth/login/login';
import { Home } from './components/public/home/home';
import { Admin } from './components/dashboard/admin/admin';
import { Entrenador } from './components/dashboard/entrenador/entrenador';
import { Registro } from './components/auth/registro/registro';
import { Usuarios } from './components/dashboard/admin/usuarios/usuarios';
import { Promociones } from './components/dashboard/admin/promociones/promociones';
import { RutinaUsuarios } from './components/dashboard/entrenador/rutina-usuarios/rutina-usuarios';
import { RutinaFormulario } from './components/dashboard/entrenador/rutina-formulario/rutina-formulario';
import { Usuario } from './components/dashboard/usuario/usuario';
import { Nutricionista } from './components/dashboard/nutricionista/nutricionista';
import { NutricionFormulario } from './components/dashboard/nutricionista/nutricion-formulario/nutricion-formulario';
import { SobreNosotros } from './components/sobre-nosotros/sobre-nosotros';
import { Calendario } from './components/calendario/calendario';
import { authGuard } from './guards/auth-guard'; // 👈 El Guard de seguridad
import { TiendaComponent } from './components/tienda/tienda';
import { ProductosAdmin } from './components/dashboard/admin/productos/productos';
import { CompraComponent } from './components/tienda/compra/compra';
import { CarritoComponent } from './components/tienda/carrito/carrito';
import { MembresiaComponent } from './components/membresia/membresia';
import { SmartBalance } from './components/smartbalance/smartbalance';
import { SeleccionEntrenadorComponent } from './components/seleccion/seleccionEntrenador/seleccionEntrenador';
import { SeleccionNutricionistaComponent } from './components/seleccion/seleccionNutricionista/seleccionNutricionista';
import { HistorialComprasComponent } from './components/historial-compras/historial-compras';
import { GestionHorariosComponent } from './components/dashboard/entrenador/gestion-horarios/gestion-horarios';
import { GestionHorariosNutriComponent } from './components/dashboard/nutricionista/gestion-horarios-nutri/gestion-horarios-nutri';
import { NutricionistaUsuarios } from './components/dashboard/nutricionista/nutricion-usuarios/nutricion-usuarios';
import { AdminPedidosComponent } from './components/dashboard/admin/pedidos/pedidos';
import { ReporteGeneralComponent } from './components/reporteGeneral/ReporteGeneral';

export const routes: Routes = [
  // ==========================================
  // 🔓 VISTAS PÚBLICAS (No requieren login)
  // ==========================================
  { path: '', component: Home },
  { path: 'login', component: Login },
  { path: 'registro', component: Registro },
  { path: 'sobreNosotros', component: SobreNosotros },
  { path: 'tienda', component: TiendaComponent },
  { path: 'carrito', component: CarritoComponent },
  { path: 'compra', component: CompraComponent },
  { path: 'membresia', component: MembresiaComponent },
  { path: 'smartbalance', component: SmartBalance },
  { path: 'seleccion-entrenador', component: SeleccionEntrenadorComponent },
  { path: 'seleccion-nutricionista', component: SeleccionNutricionistaComponent },

  // ==========================================
  // 🔒 VISTAS PRIVADAS (Protegidas por authGuard)
  // ==========================================

  // Historial de compras del usuario
  { path: 'historial-compras', component: HistorialComprasComponent, canActivate: [authGuard] },

  // Calendario general de los socios
  { path: 'calendario', component: Calendario, canActivate: [authGuard] },

  // Dashboard de Cliente / Socio
  { path: 'usuario', component: Usuario, canActivate: [authGuard] },

  // Dashboard Administrativo
  { path: 'admin/dashboard', component: Admin, canActivate: [authGuard] },
  { path: 'admin/lista-usuarios', component: Usuarios, canActivate: [authGuard] },
  { path: 'admin/promociones', component: Promociones, canActivate: [authGuard] },
  { path: 'admin/productos', component: ProductosAdmin, canActivate: [authGuard] },
  { path: 'admin/pedidos', component: AdminPedidosComponent, canActivate: [authGuard] },
  { path: 'admin/reporte-general', component: ReporteGeneralComponent, canActivate: [authGuard] },
  // Dashboard Clínico Deportivo (Entrenador y Nutricionista)
  { path: 'entrenador/dashboard', component: Entrenador, canActivate: [authGuard] },
  { path: 'nutricion/dashboard', component: Nutricionista, canActivate: [authGuard] },
  { path: 'entrenador/lista-usuarios', component: RutinaUsuarios, canActivate: [authGuard] },
  { path: 'entrenador/rutina-nueva/:id', component: RutinaFormulario, canActivate: [authGuard] },
  { path: 'nutricion/evaluar/:id', component: NutricionFormulario, canActivate: [authGuard] },
  { path: 'entrenador/gestion-horarios', component: GestionHorariosComponent, canActivate: [authGuard] },
  { path: 'nutricion/gestion-horarios', component: GestionHorariosNutriComponent, canActivate: [authGuard] },
  { path: 'nutricion/usuarios', component: NutricionistaUsuarios, canActivate: [authGuard] },
  // ==========================================
  // 🛑 RUTAS NO ENCONTRADAS
  // ==========================================
  // Si el usuario escribe una URL que no existe, lo mandamos al login
  { path: '**', redirectTo: '/login' }
];
