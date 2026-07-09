import { Component, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../services/admin.service'; // Ajusta la ruta si es necesario
import { Router } from '@angular/router';
// ─── Interfaces ───────────────────────────────────────────────────────────────
export interface KpiCard { label: string; value: string; subLabel: string; trend: number; icon: string; accentClass: string; }
export interface VentaReciente { id: number; cliente: string; producto: string; categoria: string; monto: number; fecha: string; estado: 'completado' | 'pendiente' | 'cancelado'; }
export interface ProductoTop { nombre: string; ventas: number; ingreso: number; stock: number; porcentaje: number; }
export interface DonutSegmento { label: string; valor: number; color: string; porcentaje?: number; }
export interface PuntoGrafica { mes: string; ingresos: number; egresos: number; }

@Component({
  selector: 'app-reporte-general',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ReporteGeneral.html',
  styleUrls: ['./ReporteGeneral.scss'],
})
export class ReporteGeneralComponent implements OnInit, OnDestroy {

  today: Date = new Date();

  // ── Filtros de período
  periodos: string[] = ['Hoy', 'Esta semana', 'Este mes', 'Este año'];
  periodoSeleccionado = 'Este año';

  // ── Datos dinámicos del Backend
  kpiCards: KpiCard[] = [];
  ventasRecientes: VentaReciente[] = [];
  filtroTabla = '';
  ventasFiltradas: VentaReciente[] = [];
  productosTop: ProductoTop[] = [];
  donutData: DonutSegmento[] = [];
  graficaMeses: PuntoGrafica[] = [];

  // ── Variables de cálculo para gráficas
  donutTotal = 0;
  donutSegmentos: DonutSegmento[] = [];
  donutAngulos: { inicio: number; fin: number; color: string }[] = [];
  hoveredSegmento: DonutSegmento | null = null;
  graficaMaxVal = 0;
  graficaAltura = 180;
  graficaAncho  = 600;

  cargando = true;
  private animFrameId: number | null = null;

  constructor(private adminService: AdminService, private router: Router) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  ngOnDestroy(): void {
    if (this.animFrameId !== null) cancelAnimationFrame(this.animFrameId);
  }

  // ─── CONEXIÓN AL BACKEND ──────────────────────────────────────────────────
  cargarDatos(): void {
    this.cargando = true;
    this.adminService.getReporteGeneral(this.periodoSeleccionado).subscribe({
      next: (data) => {
        // Asignamos la data real
        this.kpiCards = data.kpis;
        this.ventasRecientes = data.ventasRecientes;
        this.productosTop = data.productosTop;
        this.donutData = data.donutData;
        this.graficaMeses = data.graficaMeses;

        // Recalculamos las gráficas y filtros
        this.calcularDonut();
        this.calcularGrafica();
        this.aplicarFiltro();

        this.cargando = false;
        setTimeout(() => this.animarDonut(), 50); // Pequeño retraso para que el SVG renderice
      },
      error: (err) => {
        console.error("Error al cargar el reporte:", err);
        this.cargando = false;
      }
    });
  }

  cambiarPeriodo(periodo: string): void {
    this.periodoSeleccionado = periodo;
    this.cargarDatos(); // Llama a la BD nuevamente con el nuevo filtro
  }

  // ─── LÓGICA DE GRÁFICAS (Intacta) ─────────────────────────────────────────
  private calcularDonut(): void {
    this.donutTotal = this.donutData.reduce((sum, s) => sum + s.valor, 0);
    let acumulado = 0;
    this.donutSegmentos = this.donutData.map(seg => {
      const pct = this.donutTotal > 0 ? (seg.valor / this.donutTotal) * 100 : 0;
      return { ...seg, porcentaje: Math.round(pct) };
    });

    let inicio = -90;
    this.donutAngulos = this.donutData.map(seg => {
      const grados = this.donutTotal > 0 ? (seg.valor / this.donutTotal) * 360 : 0;
      const fin = inicio + grados;
      const angulo = { inicio, fin, color: seg.color };
      inicio = fin;
      return angulo;
    });
  }

  private animarDonut(): void {} // Se puede expandir luego si deseas animación SVG

  buildArcPath(inicioDeg: number, finDeg: number, r = 80, cx = 100, cy = 100, grosor = 32): string {
    const rad = (d: number) => (d * Math.PI) / 180;
    const x1 = cx + r * Math.cos(rad(inicioDeg)), y1 = cy + r * Math.sin(rad(inicioDeg));
    const x2 = cx + r * Math.cos(rad(finDeg)), y2 = cy + r * Math.sin(rad(finDeg));
    const ri = r - grosor;
    const x3 = cx + ri * Math.cos(rad(finDeg)), y3 = cy + ri * Math.sin(rad(finDeg));
    const x4 = cx + ri * Math.cos(rad(inicioDeg)), y4 = cy + ri * Math.sin(rad(inicioDeg));
    const large = (finDeg - inicioDeg) > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} L ${x3} ${y3} A ${ri} ${ri} 0 ${large} 0 ${x4} ${y4} Z`;
  }

  onHoverSegmento(seg: DonutSegmento | null): void { this.hoveredSegmento = seg; }

  private calcularGrafica(): void {
    if(!this.graficaMeses || this.graficaMeses.length === 0) return;
    const todos = this.graficaMeses.flatMap(m => [m.ingresos, m.egresos]);
    this.graficaMaxVal = Math.max(...todos) * 1.1 || 1; // Evitar división por cero
  }

  alturaBar(valor: number): number { return (valor / this.graficaMaxVal) * this.graficaAltura; }
  xPos(index: number, total: number): number {
    const padding = 40, espacio = (this.graficaAncho - padding * 2) / (total > 1 ? total - 1 : 1);
    return padding + index * espacio;
  }
  generarPolyline(tipo: 'ingresos' | 'egresos'): string {
    return this.graficaMeses.map((p, i) => `${this.xPos(i, this.graficaMeses.length)},${this.graficaAltura - this.alturaBar(p[tipo]) + 20}`).join(' ');
  }

  // ─── TABLA Y UTILIDADES (Intacta) ─────────────────────────────────────────
  aplicarFiltro(): void {
    const term = this.filtroTabla.toLowerCase().trim();
    this.ventasFiltradas = term
      ? this.ventasRecientes.filter(v =>
          v.cliente.toLowerCase().includes(term) || v.producto.toLowerCase().includes(term) ||
          v.categoria.toLowerCase().includes(term) || v.estado.toLowerCase().includes(term))
      : [...this.ventasRecientes];
  }

  trackByVenta(_: number, v: VentaReciente): number { return v.id; }
  trackByProducto(_: number, p: ProductoTop): string { return p.nombre; }
  trackByKpi(_: number, k: KpiCard): string { return k.label; }

  formatMoneda(valor: number): string { return 'S/ ' + valor.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  trendClass(trend: number): string { return trend > 0 ? 'trend-up' : trend < 0 ? 'trend-down' : 'trend-neutral'; }
  trendIcon(trend: number): string { return trend > 0 ? '▲' : trend < 0 ? '▼' : '—'; }

  estadoClass(estado: string): string {
    if(estado === 'completado') return 'badge-status status-completado';
    if(estado === 'pendiente') return 'badge-status status-pendiente';
    if(estado === 'cancelado') return 'badge-status status-cancelado';
    return 'badge-status';
  }

  stockClass(stock: number): string { return stock < 15 ? 'stock-critico' : stock < 30 ? 'stock-bajo' : 'stock-ok'; }

  // ─── ACCIONES DEL ADMIN ─────────────────────────────────────────────────────

  exportarReporte(): void {
    // Truco infalible para presentaciones: Usar la impresión nativa del navegador
    // Esto abrirá el menú para guardar la página entera como un PDF perfecto.
    window.print();
  }

  // ── ESTADO DEL MODAL DE VENTA ──
  ventaSeleccionada: VentaReciente | null = null;

  // ── NUEVO FORMATO INTELIGENTE PARA LA GRÁFICA ──
  formatK(valor: number): string {
    if (valor >= 1000) {
      return 'S/ ' + (valor / 1000).toFixed(1) + 'k';
    }
    // Si es menor a 1000 (ej. 250 soles de prueba), lo muestra normal sin decimales
    return 'S/ ' + Math.round(valor);
  }

  // ── MODIFICACIÓN DE ACCIONES DEL ADMIN ──
  verDetalleVenta(id: number): void {
    // En lugar de redirigir, buscamos la venta y abrimos el modal
    const venta = this.ventasFiltradas.find(v => v.id === id);
    if (venta) {
      this.ventaSeleccionada = venta;
    }
  }

  cerrarModalVenta(): void {
    this.ventaSeleccionada = null;
  }

}
