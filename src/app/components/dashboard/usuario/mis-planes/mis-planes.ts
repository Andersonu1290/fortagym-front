import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { RutinaService } from '../../../../services/rutina.service';
import { NutricionService } from '../../../../services/nutricion.service';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-mis-planes',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './mis-planes.html',
  styleUrls: ['./mis-planes.scss']
})
export class MisPlanesComponent implements OnInit {

  rutina: any = null;
  nutricion: any = null;
  cargando: boolean = true;
  vistaActual: 'rutina' | 'nutricion' = 'rutina'; // Para cambiar entre pestañas

  public readonly apiUrl = environment.apiUrl;

  constructor(
    private rutinaService: RutinaService,
    private nutricionService: NutricionService
  ) {}

  ngOnInit(): void {
    this.cargarPlanes();
  }

  cargarPlanes(): void {
    this.cargando = true;

    // Cargar Rutina
    this.rutinaService.getMiRutina().subscribe({
      next: (data) => {
        if (!data.mensaje) this.rutina = data;
      },
      error: (err) => console.error('Error cargando rutina', err)
    });

    // Cargar Nutrición
    this.nutricionService.getMiNutricion().subscribe({
      next: (data) => {
        if (!data.mensaje) this.nutricion = data;
      },
      error: (err) => console.error('Error cargando nutrición', err)
    });

    setTimeout(() => this.cargando = false, 600); // Simulamos carga para la UI
  }

  setVista(vista: 'rutina' | 'nutricion'): void {
    this.vistaActual = vista;
  }

  resolverImg(img: string): string {
    if (!img) return ''; // Si no hay foto, no devuelve nada
    if (img.startsWith('http')) return img;
    return `${this.apiUrl}${img}`;
  }
}
