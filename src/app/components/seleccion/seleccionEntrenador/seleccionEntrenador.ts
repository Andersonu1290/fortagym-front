import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

export interface SesionEntrenamiento {
  duracionMinutos: number;
  descripcion: string;
  ejercicios: string[];
}

export interface Horario {
  id: string;
  dia: string;
  hora: string;
  disponible: boolean;
  sesion: SesionEntrenamiento;
}

export interface Entrenador {
  id: string;
  nombre: string;
  especialidad: string;
  descripcion: string;
  fotoUrl: string;
  horarios: Horario[];
}

export interface ReservaEntrenamiento {
  entrenador: Entrenador;
  horario: Horario;
}

@Component({
  selector: 'app-seleccion-entrenador',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './seleccionEntrenador.html',
  styleUrls: ['./seleccionEntrenador.scss'],
})
export class SeleccionEntrenadorComponent implements OnInit {
  @Output() reservaCreada = new EventEmitter<ReservaEntrenamiento>();

  entrenadores: Entrenador[] = [];
  entrenadorSeleccionado: Entrenador | null = null;
  horarioSeleccionado: Horario | null = null;
  reservaConfirmada: ReservaEntrenamiento | null = null;
  errorMembresia: string | null = null; // Para mostrar errores de membresía

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.cargarEntrenadores();
  }

  cargarEntrenadores(): void {
    // Apunta dinámicamente a http://localhost:8089 según tu environment.development.ts
    this.http.get<Entrenador[]>(`${environment.apiUrl}/api/entrenadores`).subscribe({
      next: (data) => {
        // Recorremos el arreglo y aplicamos EXACTAMENTE la misma lógica del header a cada entrenador
        this.entrenadores = data.map(entrenador => {
          return {
            ...entrenador,
            // Sobrescribimos fotoUrl con la misma ruta y parámetro de tiempo (para evitar caché) que usa el header
            fotoUrl: `${environment.apiUrl}/api/usuarios/foto/${entrenador.id}?t=${Date.now()}`
          };
        });
      },
      error: (err) => console.error('Error al cargar entrenadores:', err)
    });
  }

  seleccionarEntrenador(entrenador: Entrenador): void {
    if (this.entrenadorSeleccionado?.id !== entrenador.id) {
      this.horarioSeleccionado = null;
      this.reservaConfirmada = null;
      this.errorMembresia = null;
    }
    this.entrenadorSeleccionado = entrenador;
  }

  seleccionarHorario(horario: Horario): void {
    if (!horario.disponible) return;
    this.horarioSeleccionado = horario;
    this.errorMembresia = null;
  }

  esEntrenadorSeleccionado(entrenador: Entrenador): boolean {
    return this.entrenadorSeleccionado?.id === entrenador.id;
  }

  esHorarioSeleccionado(horario: Horario): boolean {
    return this.horarioSeleccionado?.id === horario.id;
  }

  puedeConfirmar(): boolean {
    return !!this.entrenadorSeleccionado && !!this.horarioSeleccionado;
  }

  confirmarReserva(): void {
    if (!this.entrenadorSeleccionado || !this.horarioSeleccionado) return;

    const token = localStorage.getItem('token');
    if (!token) {
      alert("Debes iniciar sesión para agendar un entrenamiento.");
      return;
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    // Hacemos el POST al backend para guardar la reserva y validar membresía
    this.http.post(`${environment.apiUrl}/api/entrenadores/reservar/${this.horarioSeleccionado.id}`, {}, { headers })
      .subscribe({
        next: (respuesta: any) => {
          // Reserva exitosa
          const reserva: ReservaEntrenamiento = {
            entrenador: this.entrenadorSeleccionado!,
            horario: this.horarioSeleccionado!,
          };

          this.horarioSeleccionado!.disponible = false; // Lo bloqueamos visualmente
          this.reservaConfirmada = reserva;
          this.reservaCreada.emit(reserva);
        },
        error: (err) => {
          // Si devuelve error 403, significa que NO tiene membresía
          if (err.status === 403) {
            this.errorMembresia = err.error.error;
            alert(this.errorMembresia);
          } else {
            alert('Error al procesar la reserva. El horario podría estar ocupado.');
          }
        }
      });
  }
}
