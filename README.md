# FortaGym - Frontend Web Application 🏋️‍♂️

![Angular](https://img.shields.io/badge/Angular-DD0031?style=for-the-badge&logo=angular&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![NPM](https://img.shields.io/badge/npm-CB3837?style=for-the-badge&logo=npm&logoColor=white)
![Netlify](https://img.shields.io/badge/Netlify-00C7B7?style=for-the-badge&logo=netlify&logoColor=white)

FortaGym es una plataforma web integral diseñada para la gestión moderna de un gimnasio. Esta aplicación frontend (Single Page Application) proporciona una experiencia de usuario fluida y responsiva tanto para los clientes del gimnasio como para el personal administrativo y profesionales (entrenadores y nutricionistas).

🔗 **Sitio Web Desplegado:** [https://fortagym-front.netlify.app/](https://fortagym-front.netlify.app/)

---

## 🚀 Características Principales

El sistema está división en múltiples módulos según el rol del usuario (Autenticación basada en JWT). 

🔒 **Flujo de Acceso Directo:** Al iniciar sesión con éxito, el sistema redirige automáticamente al usuario de forma directa a su panel de control o dashboard correspondiente según su rol asignado (`ADMIN`, `NUTRICIONISTA`, `ENTRENADOR` o `USUARIO`).

* **Autenticación y Perfiles:** Registro, inicio de sesión seguro, redirección inteligente por rol, gestión de perfiles y subida de avatares.
* **Tienda E-commerce:** Catálogo de productos (suplementos, ropa, accesorios), carrito de compras dinámico y pasarela de checkout con cálculo de envíos e IGV.
* **Gestión de Membresías:** Visualización de planes, adquisición de pases diarios y pagos integrados.
* **Sistema de Reservas:** Calendario interactivo para reservar sesiones personalizadas con entrenadores y consultas con nutricionistas, respetando los límites de la membresía activa.
* **Cartilla Digital:** Acceso en tiempo real a rutinas de entrenamiento personalizadas y evaluaciones nutricionales.
* **Dashboard Administrativo (KPIs):** Panel de control avanzado para el administrador con gráficas de ingresos, estado de ventas, monitoreo de stock crítico y gestión de usuarios/roles.
* **Gestión de Personal:** Paneles dedicados para que entrenadores y nutricionistas administren su disponibilidad, horarios y clientes asignados.

---

## 🛠️ Tecnologías Utilizadas

* **Framework:** Angular
* **Lenguaje:** TypeScript
* **Estilos:** CSS / SCSS (Diseño responsive y moderno)
* **Control de Estado & Peticiones:** RxJS y HttpClient
* **Autenticación:** Interceptores JWT (JSON Web Tokens)
* **Despliegue Frontend:** Netlify (Plan Gratuito)
* **Alojamiento Backend:** Render (Plan Gratuito)

---

## 👥 Usuarios de Prueba y Roles

Para facilitar la revisión y pruebas de las distintas funcionalidades y niveles de acceso (RBAC), puedes iniciar sesión utilizando las siguientes credenciales. 

> 🔑 **Nota:** La contraseña para **todos** los usuarios de prueba es **`123456`** *(en la base de datos se encuentra encriptada mediante BCrypt)*. Al ingresar, irás directamente al panel específico de tu rol.

| Nombre | Rol | Correo Electrónico | Contraseña | Destino post-login |
| :--- | :--- | :--- | :--- | :--- |
| **Anderson Urrutia** | `ADMIN` | admin@fortagym.com | `123456` | Dashboard Administrativo (KPIs) |
| **Carlos Mendoza** | `ENTRENADOR` | entrenador@fortagym.com | `123456` | Panel de Horarios y Clientes |
| **Valeria Salas** | `NUTRICIONISTA` | nutricion@fortagym.com | `123456` | Panel de Consultas y Evaluaciones |
| **Juan Pablo Torres** | `USUARIO` (Cliente) | juanpablo@gmail.com | `123456` | Vista de Cliente / Cartilla |

---

## ⚙️ Instalación y Configuración Local

Sigue estos pasos para ejecutar el proyecto en tu entorno local:

### 1. Prerrequisitos
Asegúrate de tener instalado [Node.js](https://nodejs.org/) (recomendado v18 o superior) y el CLI de Angular.
```bash
npm install -g @angular/cli
```

### 2. Clonar el repositorio
```bash
git clone https://github.com/Andersonu1290/fortagym-front.git
cd fortagym-front
```

### 3. Instalar dependencias
```bash
npm install
```

### 4. Configurar Variables de Enorno
Verifica que las rutas de la API apunten a tu backend. Por defecto, en desarrollo debería apuntar a `http://localhost:8089` y en producción a la URL de tu servicio en la nube en **Render (Free Plan)**. Esto se configura en los archivos dentro de la carpeta `src/environments/`.

### 5. Ejecutar el servidor de desarrollo
```bash
ng serve
```
Abre tu navegador y navega a `http://localhost:4200/`. La aplicación se recargará automáticamente si cambias alguno de los archivos fuente.

---

## 📦 Construcción para Producción

Para compilar el proyecto y prepararlo para su despliegue:
```bash
ng build --configuration production
```
Los archivos optimizados se generarán en el directorio `dist/` y estarán listos para ser alojados en servicios como Netlify.

---

## 🔗 Backend / API REST (Complemento)

Este repositorio contiene únicamente el código del cliente (Frontend). Para que la aplicación funcione correctamente, debe estar conectada a su respectiva API REST construida en Java con Spring Boot, la cual se encuentra desplegada gratuitamente en **Render**.

Puedes encontrar el código fuente del backend, la estructura de la base de datos y las configuraciones de despliegue en el siguiente repositorio:

👉 [FortaGym API - Repositorio Backend](AQUÍ_EL_LINK_DEL_BACKEND)
