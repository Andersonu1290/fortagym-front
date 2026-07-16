import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {

  const authService = inject(AuthService);
  const token = authService.getToken();

  let isPublic = false;

  // LOGIN Y REGISTRO
  if (
    req.url.includes('/api/auth/login') ||
    req.url.includes('/api/usuarios/registro')
  ) {
    isPublic = true;
  }

  // PRODUCTOS PÚBLICOS
  // Productos públicos
  if (
    req.url.endsWith('/api/productos') &&
    req.method === 'GET'
  ) {
    isPublic = true;
  }

  // Productos eliminados NO son públicos
  if (req.url.includes('/api/productos/eliminados')) {
    isPublic = false;
  }

  // 🔥 PROMOCIONES PÚBLICAS
  if (
    req.url.includes('/api/admin/promociones') &&
    req.method === 'GET'
  ) {
    isPublic = true;
  }

  // AGREGAR TOKEN
  if (token && !isPublic) {

    let clonedReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });

    // FORM DATA
    if (req.body instanceof FormData) {

      clonedReq = clonedReq.clone({
        headers: clonedReq.headers.delete('Content-Type')
      });

    } else {

      clonedReq = clonedReq.clone({
        setHeaders: {
          'Content-Type': 'application/json'
        }
      });

    }

    return next(clonedReq);
  }

  return next(req);
};
