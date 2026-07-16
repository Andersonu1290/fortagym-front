import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RutinaService {
  private apiUrl = `${environment.apiUrl}/api/rutinas`;

  constructor(private http: HttpClient) {}

  // 📋 Obtiene la lista de usuarios con el estado de su rutina (si tiene o no)
  getUsuariosEstado(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/usuarios-estado`);
  }

  getRutinaUsuario(usuarioId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/usuario/${usuarioId}`);
  }

  guardarRutina(rutina: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/guardar`, rutina);
  }

  getMiRutina(): Observable<any> {
    return this.http.get(`${this.apiUrl}/mi-rutina`);
  }
}
