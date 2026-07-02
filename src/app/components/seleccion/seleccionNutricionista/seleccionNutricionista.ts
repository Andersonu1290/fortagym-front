import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

export interface DetalleConsulta {
  duracionMinutos: number;
  descripcion: string;
  temas: string[];
}

export interface HorarioConsulta {
  id: string;
  dia: string;
  hora: string;
  disponible: boolean;
  detalle: DetalleConsulta;
}

export interface Nutricionista {
  id: string;
  nombre: string;
  especialidad: string;
  descripcion: string;
  fotoUrl: string;
  horarios: HorarioConsulta[];
}

export type ObjetivoNutricional = 'Bajar de peso' | 'Ganar masa muscular' | 'Mantener peso' | 'Mejorar rendimiento';

export interface DatosBasicosUsuario {
  pesoKg: number;
  alturaCm: number;
  objetivo: ObjetivoNutricional;
}

export interface ReservaConsulta {
  nutricionista: Nutricionista;
  horario: HorarioConsulta;
  datosUsuario: DatosBasicosUsuario;
}

@Component({
  selector: 'app-seleccion-nutricionista',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './seleccionNutricionista.html',
  styleUrls: ['./seleccionNutricionista.scss'],
})
export class SeleccionNutricionistaComponent implements OnInit {
  @Output() reservaCreada = new EventEmitter<ReservaConsulta>();

  objetivosDisponibles: ObjetivoNutricional[] = [
    'Bajar de peso',
    'Ganar masa muscular',
    'Mantener peso',
    'Mejorar rendimiento',
  ];

  nutricionistas: Nutricionista[] = [];
  nutricionistaSeleccionado: Nutricionista | null = null;
  horarioSeleccionado: HorarioConsulta | null = null;
  reservaConfirmada: ReservaConsulta | null = null;

  datosUsuario: DatosBasicosUsuario = {
    pesoKg: null as unknown as number,
    alturaCm: null as unknown as number,
    objetivo: 'Bajar de peso',
  };

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.cargarNutricionistas();
  }

  cargarNutricionistas(): void {
    this.http.get<Nutricionista[]>(`${environment.apiUrl}/api/nutricionistas`).subscribe({
      next: (data) => {
        // Recorremos el arreglo de nutricionistas y construimos la URL de la foto igual que en el Header
        this.nutricionistas = data.map(nutricionista => {
          return {
            ...nutricionista,
            // Sobrescribimos fotoUrl con la ruta dinámica que ya te funciona
            fotoUrl: `${environment.apiUrl}/api/usuarios/foto/${nutricionista.id}?t=${Date.now()}`
          };
        });
      },
      error: (err) => console.error('Error al cargar nutricionistas:', err)
    });
  }

  seleccionarNutricionista(nutricionista: Nutricionista): void {
    if (this.nutricionistaSeleccionado?.id !== nutricionista.id) {
      this.horarioSeleccionado = null;
      this.reservaConfirmada = null;
    }
    this.nutricionistaSeleccionado = nutricionista;
  }

  seleccionarHorario(horario: HorarioConsulta): void {
    if (!horario.disponible) return;
    this.horarioSeleccionado = horario;
  }

  esNutricionistaSeleccionada(nutricionista: Nutricionista): boolean {
    return this.nutricionistaSeleccionado?.id === nutricionista.id;
  }

  esHorarioSeleccionado(horario: HorarioConsulta): boolean {
    return this.horarioSeleccionado?.id === horario.id;
  }

  datosUsuarioValidos(): boolean {
    return (
      !!this.datosUsuario.pesoKg && this.datosUsuario.pesoKg > 0 &&
      !!this.datosUsuario.alturaCm && this.datosUsuario.alturaCm > 0 &&
      !!this.datosUsuario.objetivo
    );
  }

  puedeConfirmar(): boolean {
    return !!this.nutricionistaSeleccionado && !!this.horarioSeleccionado && this.datosUsuarioValidos();
  }

  confirmarReserva(): void {
    if (!this.puedeConfirmar()) return;

    const token = localStorage.getItem('token');
    if (!token) {
      alert("Debes iniciar sesión para agendar una consulta.");
      return;
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    // Enviamos el ID del horario en la URL y los datos (peso, altura, objetivo) en el cuerpo (Body)
    this.http.post(`${environment.apiUrl}/api/nutricionistas/reservar/${this.horarioSeleccionado!.id}`, this.datosUsuario, { headers })
      .subscribe({
        next: (respuesta: any) => {
          const reserva: ReservaConsulta = {
            nutricionista: this.nutricionistaSeleccionado!,
            horario: this.horarioSeleccionado!,
            datosUsuario: { ...this.datosUsuario },
          };

          this.horarioSeleccionado!.disponible = false;
          this.reservaConfirmada = reserva;
          this.reservaCreada.emit(reserva);
        },
        error: (err) => {
          if (err.status === 403) {
            alert(err.error.error); // Mensaje de membresía requerida
          } else {
            alert('Error al procesar la reserva. Inténtalo de nuevo.');
          }
        }
      });
  }
}
