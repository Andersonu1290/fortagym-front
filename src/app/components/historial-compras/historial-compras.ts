import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http'; // 🔥 Importamos HttpClient
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { environment } from '../../../environments/environment'; // 🔥 Importamos el environment
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface ItemPedido {
  id: number;
  nombre: string;
  categoria: string;
  img: string;
  precio: number;
  cantidad: number;
}

export type EstadoPedido = 'procesando' | 'en_camino' | 'entregado' | 'cancelado';

export interface Pedido {
  id: number;
  numeroOrden: string;
  fechaCreacion: Date | string;
  estado: EstadoPedido;
  items: ItemPedido[];
  subtotal: number;
  costoEnvio: number;
  descuento: number;
  igv: number;
  total: number;
  nombreCliente: string;
  metodoEntrega: string;
  direccion: string;
  distrito: string;
  departamento: string;
  metodoPago: string;
  correo: string;
}

export interface EtapaTimeline {
  titulo: string;
  icono: string;
  clase: 'done' | 'active' | 'pending';
  fecha?: string;
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const FALLBACK_IMG = 'assets/images/producto-placeholder.png';

const STATUS_LABELS: Record<EstadoPedido, string> = {
  procesando: 'Procesando',
  en_camino: 'En camino',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
};

const STATUS_ICONS: Record<EstadoPedido, string> = {
  procesando: 'ti-clock',
  en_camino: 'ti-truck',
  entregado: 'ti-circle-check',
  cancelado: 'ti-x',
};

// Pipeline completo de estados en orden progresivo
const PIPELINE_ESTADOS: EstadoPedido[] = ['procesando', 'en_camino', 'entregado'];

const TIMELINE_CONFIG: Record<EstadoPedido, { titulo: string; icono: string }> = {
  procesando: { titulo: 'Pedido confirmado',  icono: 'ti-check'           },
  en_camino:  { titulo: 'En camino',          icono: 'ti-truck'           },
  entregado:  { titulo: 'Entregado',          icono: 'ti-circle-check'    },
  cancelado:  { titulo: 'Pedido cancelado',   icono: 'ti-x'               },
};

// ─── Componente ───────────────────────────────────────────────────────────────

@Component({
  selector: 'app-historial-compras',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './historial-compras.html',
  styleUrls: ['./historial-compras.scss'],
})
export class HistorialComprasComponent implements OnInit, OnDestroy {

  // ── Estado de UI ──────────────────────────────────────────────
  cargando = false;
  pedidoExpandido: number | null = null;

  // ── Datos ─────────────────────────────────────────────────────
  pedidos: Pedido[] = [];
  pedidosFiltrados: Pedido[] = [];

  // ── Stats calculadas ──────────────────────────────────────────
  totalPedidos = 0;
  totalGastado = 0;
  pedidosActivos = 0;

  // ── Filtros ───────────────────────────────────────────────────
  terminoBusqueda = '';
  filtroEstado: EstadoPedido | '' = '';
  filtroPeriodo = '';

  private destroy$ = new Subject<void>();

  // 🔥 Inyectamos el HttpClient para comunicarnos con Spring Boot
  constructor(
    private http: HttpClient
  ) {}

  // ── Ciclo de vida ─────────────────────────────────────────────

  ngOnInit(): void {
    this.cargarPedidos();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Carga de datos ────────────────────────────────────────────

  cargarPedidos(): void {
    this.cargando = true;

    // 🔥 Llamada real al backend en lugar de setTimeout
    this.http.get<Pedido[]>(`${environment.apiUrl}/api/tienda/pedidos`)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.cargando = false)
      )
      .subscribe({
        next: (data) => {
          this.inicializarDatos(data);
        },
        error: (err) => {
          console.error('Error al cargar pedidos desde el backend:', err);
        }
      });
  }

  private inicializarDatos(pedidos: Pedido[]): void {
    this.pedidos = pedidos;
    this.calcularStats();
    this.aplicarFiltros();
  }

  // ── Stats ─────────────────────────────────────────────────────

  private calcularStats(): void {
    this.totalPedidos = this.pedidos.length;

    this.totalGastado = this.pedidos
      .filter(p => p.estado !== 'cancelado')
      .reduce((acc, p) => acc + p.total, 0);

    this.pedidosActivos = this.pedidos
      .filter(p => p.estado === 'procesando' || p.estado === 'en_camino')
      .length;
  }

  // ── Filtros ───────────────────────────────────────────────────

  aplicarFiltros(): void {
    let resultado = [...this.pedidos];

    // Filtro por término de búsqueda (número de orden)
    if (this.terminoBusqueda.trim()) {
      const termino = this.terminoBusqueda.trim().toLowerCase();
      resultado = resultado.filter(p =>
        p.numeroOrden.toLowerCase().includes(termino)
      );
    }

    // Filtro por estado
    if (this.filtroEstado) {
      resultado = resultado.filter(p => p.estado === this.filtroEstado);
    }

    // Filtro por período
    if (this.filtroPeriodo) {
      const dias = Number(this.filtroPeriodo);
      const corte = new Date();
      corte.setDate(corte.getDate() - dias);
      resultado = resultado.filter(p => new Date(p.fechaCreacion) >= corte);
    }

    this.pedidosFiltrados = resultado;
  }

  limpiarFiltros(): void {
    this.terminoBusqueda = '';
    this.filtroEstado    = '';
    this.filtroPeriodo   = '';
    this.aplicarFiltros();
  }

  // ── Expansión de tarjetas ─────────────────────────────────────

  toggleExpand(id: number): void {
    this.pedidoExpandido = this.pedidoExpandido === id ? null : id;
  }

  // ── Helpers de presentación ───────────────────────────────────

  getStatusLabel(estado: EstadoPedido): string {
    return STATUS_LABELS[estado] ?? estado;
  }

  getStatusIcon(estado: EstadoPedido): string {
    return STATUS_ICONS[estado] ?? 'ti-help';
  }

  getTimeline(estado: EstadoPedido): EtapaTimeline[] {
    if (estado === 'cancelado') {
      return [{
        titulo: TIMELINE_CONFIG.cancelado.titulo,
        icono:  TIMELINE_CONFIG.cancelado.icono,
        clase:  'active',
        fecha:  undefined,
      }];
    }

    const idxActual = PIPELINE_ESTADOS.indexOf(estado);

    return PIPELINE_ESTADOS.map((e, idx) => {
      let clase: EtapaTimeline['clase'];
      if (idx < idxActual)       clase = 'done';
      else if (idx === idxActual) clase = 'active';
      else                        clase = 'pending';

      return {
        titulo: TIMELINE_CONFIG[e].titulo,
        icono:  TIMELINE_CONFIG[e].icono,
        clase,
        fecha: undefined,
      };
    });
  }

  /**
   * 🔥 Devuelve la URL de la imagen. Concatena la API si es necesario.
   */
  resolverImg(img: string): string {
    if (!img || !img.trim()) {
      return FALLBACK_IMG;
    }
    // Si la imagen ya es una URL completa (ej. de internet), la devolvemos tal cual
    if (img.startsWith('http')) {
      return img;
    }
    // Si es una ruta local de Spring Boot (ej. /uploads/...), le agregamos el dominio
    return `${environment.apiUrl}${img}`;
  }

  // ── Acciones del pedido ───────────────────────────────────────

  cancelarPedido(id: number): void {
    if (!confirm('¿Estás seguro de que deseas cancelar este pedido?')) return;

    // 🔥 Llamada real al backend para cancelar
    this.http.put(`${environment.apiUrl}/api/tienda/pedidos/${id}/cancelar`, {})
      .subscribe({
        next: () => {
          alert('Pedido cancelado correctamente');
          this.cargarPedidos(); // Recargamos la tabla para ver el nuevo estado
        },
        error: (err) => console.error('Error al cancelar:', err)
      });
  }

  descargarFactura(id: number): void {
    const pedido = this.pedidos.find(p => p.id === id);
    if (!pedido) return;

    const doc = new jsPDF();

    // Colores corporativos (RGB)
    const primaryColor: [number, number, number] = [255, 141, 34]; // Naranja FortaGym
    const textColor: [number, number, number] = [51, 65, 85];      // Slate 700
    const lightGray: [number, number, number] = [248, 250, 252];   // Slate 50

    // ==========================================
    // 1. CABECERA: DATOS DE LA EMPRESA
    // ==========================================
    doc.setFontSize(24);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFont("helvetica", "bold");
    doc.text('FORTAGYM', 14, 22);

    doc.setFontSize(9);
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.setFont("helvetica", "normal");
    doc.text('RUC: 20123456789', 14, 28);
    doc.text('Sede Central: Chaclacayo, Lima, Perú', 14, 33);
    doc.text('Teléfono: +51 999 888 777', 14, 38);
    doc.text('Correo: ventas@fortagym.com', 14, 43);

    // ==========================================
    // 2. CUADRO DE COMPROBANTE (Derecha)
    // ==========================================
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setLineWidth(0.5);
    doc.roundedRect(125, 15, 70, 26, 3, 3); // Caja con bordes redondeados

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text('BOLETA DE VENTA', 160, 23, { align: 'center' });
    doc.text('ELECTRÓNICA', 160, 28, { align: 'center' });
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFontSize(12);
    doc.text(`${pedido.numeroOrden}`, 160, 36, { align: 'center' });

    // Línea separadora
    doc.setDrawColor(226, 232, 240); // Slate 200
    doc.line(14, 50, 196, 50);

    // ==========================================
    // 3. DATOS DEL CLIENTE Y ENVÍO
    // ==========================================
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.setFontSize(9);

    // --> Columna Izquierda (Cliente)
    doc.setFont("helvetica", "bold");
    doc.text('DATOS DEL CLIENTE:', 14, 60);
    doc.setFont("helvetica", "normal");
    doc.text(`Nombre: ${pedido.nombreCliente}`, 14, 66);
    doc.text(`Correo: ${pedido.correo}`, 14, 71);
    doc.text(`Método de Pago: ${pedido.metodoPago.toUpperCase()}`, 14, 76);

    // --> Columna Derecha (Envío/Orden)
    doc.setFont("helvetica", "bold");
    doc.text('DETALLES DE LA ORDEN:', 110, 60);
    doc.setFont("helvetica", "normal");
    doc.text(`Fecha de Emisión: ${new Date(pedido.fechaCreacion).toLocaleDateString()} ${new Date(pedido.fechaCreacion).toLocaleTimeString()}`, 110, 66);
    doc.text(`Método de Entrega: ${pedido.metodoEntrega.toUpperCase()}`, 110, 71);

    // Lógica para la dirección (Presencial vs Delivery)
    const direccionPrint = pedido.metodoEntrega === 'sede'
      ? 'RECOJO PRESENCIAL: Sede Central FortaGym, Chaclacayo'
      : `${pedido.direccion}, ${pedido.distrito}, ${pedido.departamento}`;

    // Hacemos que la dirección salte de línea automáticamente si es muy larga
    const splitDir = doc.splitTextToSize(`Dirección: ${direccionPrint}`, 85);
    doc.text(splitDir, 110, 76);

    // ==========================================
    // 4. TABLA DE PRODUCTOS
    // ==========================================
    let startY = 85 + (splitDir.length * 4); // Ajustar inicio de tabla según la longitud de la dirección

    const bodyTabla = pedido.items.map(item => [
      item.cantidad.toString(),
      item.nombre,
      item.categoria || 'Tienda',
      `S/. ${item.precio.toFixed(2)}`,
      `S/. ${(item.precio * item.cantidad).toFixed(2)}`
    ]);

    autoTable(doc, {
      startY: startY,
      head: [['Cant.', 'Descripción del Producto', 'Categoría', 'Precio Unit.', 'Subtotal']],
      body: bodyTabla,
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center'
      },
      alternateRowStyles: { fillColor: lightGray },
      styles: { fontSize: 9, cellPadding: 5, textColor: textColor },
      columnStyles: {
        0: { halign: 'center', cellWidth: 15 },
        1: { cellWidth: 70 },
        3: { halign: 'right', cellWidth: 28 },
        4: { halign: 'right', cellWidth: 28 }
      }
    });

    // ==========================================
    // 5. RESUMEN DE TOTALES (Abajo a la derecha)
    // ==========================================
    const finalY = (doc as any).lastAutoTable.finalY + 10;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");

    // Subtotal
    doc.text('Subtotal:', 150, finalY);
    doc.text(`S/. ${pedido.subtotal.toFixed(2)}`, 196, finalY, { align: 'right' });

    // Envío
    doc.text('Costo de Envío:', 150, finalY + 6);
    doc.text(pedido.costoEnvio === 0 ? 'GRATIS' : `S/. ${pedido.costoEnvio.toFixed(2)}`, 196, finalY + 6, { align: 'right' });

    // Descuento (Si existe, lo ponemos en verde)
    let nextY = finalY + 12;
    if (pedido.descuento > 0) {
      doc.setTextColor(22, 163, 74); // Verde éxito
      doc.text('Descuento (Cupón):', 150, nextY);
      doc.text(`- S/. ${pedido.descuento.toFixed(2)}`, 196, nextY, { align: 'right' });
      doc.setTextColor(textColor[0], textColor[1], textColor[2]); // Restaurar color texto
      nextY += 6;
    }

    // IGV
    doc.text('IGV (18%):', 150, nextY);
    doc.text(`S/. ${pedido.igv.toFixed(2)}`, 196, nextY, { align: 'right' });

    // Línea separadora de total
    doc.setDrawColor(226, 232, 240);
    doc.line(140, nextY + 4, 196, nextY + 4);

    // Total final
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('TOTAL A PAGAR:', 135, nextY + 12);
    doc.text(`S/. ${pedido.total.toFixed(2)}`, 196, nextY + 12, { align: 'right' });

    // ==========================================
    // 6. PIE DE PÁGINA (Términos legales)
    // ==========================================
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(148, 163, 184); // Slate 400

    const footerY = 275;
    doc.text('Gracias por confiar en FortaGym.', 105, footerY, { align: 'center' });
    doc.text('Este documento es una representación impresa de una Boleta de Venta Electrónica.', 105, footerY + 5, { align: 'center' });
    doc.text('Para cambios o devoluciones, conserve este documento. Válido por 7 días calendario.', 105, footerY + 10, { align: 'center' });

    // Descargar el PDF
    doc.save(`Boleta_${pedido.numeroOrden}.pdf`);
  }

  rastrearPedido(id: number): void {
    console.log('[MOCK] Rastrear pedido ID:', id);
  }

  recomprar(pedido: Pedido): void {
    console.log('[MOCK] Recomprar pedido ID:', pedido.id);
  }
}
