import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  // 🔄 CORREGIDO: Se cambiaron las comillas simples por comillas invertidas ` e inyectamos api/ correctamente según tu base de rutas
  private apiUrl = `${environment.apiUrl}/api/admin`;

  constructor(private http: HttpClient) {}

  getUsuarios(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/usuarios`);
  }

  // 🗑️ Borrar usuario
  eliminarUsuario(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/eliminar/${id}`);
  }

  // 🎭 Cambiar rol (Usamos @RequestParam como en tu Controller de Java)
  actualizarRol(id: number, nuevoRol: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/cambiar-rol/${id}?rol=${nuevoRol}`, {});
  }

  // 📦 OBTENER TODOS LOS PEDIDOS (Tienda)
  getPedidosTienda(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/pedidos`);
  }

  // 🔄 CAMBIAR ESTADO DEL PEDIDO
  actualizarEstadoPedido(id: number, nuevoEstado: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/pedidos/${id}/estado?nuevoEstado=${nuevoEstado}`, {});
  }

  // OBTENER REPORTE GENERAL (DASHBOARD)
  getReporteGeneral(periodo: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/reporte-general?periodo=${periodo}`);
  }
}
