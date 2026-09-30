# FortaGym - Frontend Web Application 🏋️‍♂️

![Angular](https://img.shields.io/badge/Angular-DD0031?style=for-the-badge&logo=angular&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![NPM](https://img.shields.io/badge/npm-CB3837?style=for-the-badge&logo=npm&logoColor=white)
![Netlify](https://img.shields.io/badge/Netlify-00C7B7?style=for-the-badge&logo=netlify&logoColor=white)

FortaGym es una plataforma web integral diseñada para la gestión moderna de un gimnasio. Esta aplicación frontend (Single Page Application) proporciona una experiencia de usuario fluida y responsiva tanto para los clientes del gimnasio como para el personal administrativo y profesionales (entrenadores y nutricionistas).

## 🚀 Características Principales

El sistema está dividido en múltiples módulos según el rol del usuario (Autenticación basada en JWT):

*   **Autenticación y Perfiles:** Registro, inicio de sesión seguro, gestión de perfiles y subida de avatares.
*   **Tienda E-commerce:** Catálogo de productos (suplementos, ropa, accesorios), carrito de compras dinámico y pasarela de checkout con cálculo de envíos e IGV.
*   **Gestión de Membresías:** Visualización de planes, adquisición de pases diarios y pagos integrados.
*   **Sistema de Reservas:** Calendario interactivo para reservar sesiones personalizadas con entrenadores y consultas con nutricionistas, respetando los límites de la membresía activa.
*   **Cartilla Digital:** Acceso en tiempo real a rutinas de entrenamiento personalizadas y evaluaciones nutricionales.
*   **Dashboard Administrativo (KPIs):** Panel de control avanzado para el administrador con gráficas de ingresos, estado de ventas, monitoreo de stock crítico y gestión de usuarios/roles.
*   **Gestión de Personal:** Paneles dedicados para que entrenadores y nutricionistas administren su disponibilidad, horarios y clientes asignados.

## 🛠️ Tecnologías Utilizadas

*   **Framework:** Angular
*   **Lenguaje:** TypeScript
*   **Estilos:** CSS / SCSS (Diseño responsive y moderno)
*   **Control de Estado & Peticiones:** RxJS y HttpClient
*   **Autenticación:** Interceptores JWT (JSON Web Tokens)
*   **Despliegue:** Netlify

## ⚙️ Instalación y Configuración Local

Sigue estos pasos para ejecutar el proyecto en tu entorno local:

### 1. Prerrequisitos
Asegúrate de tener instalado [Node.js](https://nodejs.org/) (recomendado v18 o superior) y el CLI de Angular.
```bash
npm install -g @angular/cli

2. Clonar el repositorio
git clone [https://github.com/Andersonu1290/fortagym-front.git](https://github.com/Andersonu1290/fortagym-front.git)
cd fortagym-front

3. Instalar dependencias
npm install

4. Configurar Variables de Entorno
Verifica que las rutas de la API apunten a tu backend. Por defecto, en desarrollo debería apuntar a http://localhost:8089 y en producción a la URL de tu servicio en la nube (ej. Render). Esto se configura en los archivos dentro de la carpeta src/environments/.
5. Ejecutar el servidor de desarrollo
ng serve

Abre tu navegador y navega a http://localhost:4200/. La aplicación se recargará automáticamente si cambias alguno de los archivos fuente.
📦 Construcción para Producción
Para compilar el proyecto y prepararlo para su despliegue:
ng build --configuration production

Los archivos optimizados se generarán en el directorio dist/ y estarán listos para ser alojados en servicios como Netlify, Vercel o Firebase Hosting.
🔗 Backend / API REST (Complemento)
Este repositorio contiene únicamente el código del cliente (Frontend). Para que la aplicación funcione correctamente, debe estar conectada a su respectiva API REST construida en Java con Spring Boot.
Puedes encontrar el código fuente del backend, la estructura de la base de datos y las configuraciones de despliegue en el siguiente repositorio:
👉 FortaGym API - Repositorio Backend

