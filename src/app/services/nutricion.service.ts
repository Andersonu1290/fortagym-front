import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class NutricionService {
  private apiNutri = `${environment.apiUrl}/api/nutricion`;
  private apiRutina = `${environment.apiUrl}/api/rutinas`;

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getHeaders() {
    const token = this.authService.getToken();
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  // 📋 Listar usuarios y ver quién tiene cartilla (Usa el endpoint de RutinaController)
  getUsuariosEstado(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiRutina}/usuarios-estado`, { headers: this.getHeaders() });
  }

  // 🔍 Obtener la cartilla de un usuario específico
  getNutricionPorUsuario(id: number): Observable<any> {
    return this.http.get(`${this.apiNutri}/usuario/${id}`, { headers: this.getHeaders() });
  }

  // 💾 Guardar o actualizar datos nutricionales
  guardarNutricion(datos: any): Observable<any> {
    return this.http.post(`${this.apiNutri}/guardar`, datos, { headers: this.getHeaders() });
  }

  // 🗑️ Eliminar cartilla de un usuario
  eliminarNutricion(usuarioId: number): Observable<any> {
    return this.http.delete(`${this.apiNutri}/eliminar/usuario/${usuarioId}`, { headers: this.getHeaders() });
  }

  getMiNutricion(): Observable<any> {
    return this.http.get(`${this.apiNutri}/mi-cartilla`);
  }
}
