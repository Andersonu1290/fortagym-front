import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By }                    from '@angular/platform-browser';
import { CommonModule }          from '@angular/common';
import { FormsModule }           from '@angular/forms';

import { ReporteGeneralComponent } from './ReporteGeneral';

// ─── Helper para inicializar el componente ────────────────────────────────────
async function setup() {
  await TestBed.configureTestingModule({
    imports: [ReporteGeneralComponent, CommonModule, FormsModule],
  }).compileComponents();

  const fixture   = TestBed.createComponent(ReporteGeneralComponent);
  const component = fixture.componentInstance;
  fixture.detectChanges();
  return { fixture, component };
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUITE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════
describe('ReporteGeneralComponent', () => {

  // ── 1. Creación del componente ────────────────────────────────────────────
  describe('Creación', () => {

    it('debería crearse correctamente', async () => {
      const { component } = await setup();
      expect(component).toBeTruthy();
    });

    it('debería tener "Este mes" como período inicial', async () => {
      const { component } = await setup();
      expect(component.periodoSeleccionado).toBe('Este mes');
    });

    it('debería inicializar las 4 opciones de período', async () => {
      const { component } = await setup();
      expect(component.periodos.length).toBe(4);
      expect(component.periodos).toContain('Hoy');
      expect(component.periodos).toContain('Esta semana');
      expect(component.periodos).toContain('Este mes');
      expect(component.periodos).toContain('Este año');
    });
  });

  // ── 2. KPI Cards ─────────────────────────────────────────────────────────
  describe('KPI Cards', () => {

    it('debería tener exactamente 6 KPI cards', async () => {
      const { component } = await setup();
      expect(component.kpiCards.length).toBe(6);
    });

    it('debería renderizar las 6 kpi-card en el DOM', async () => {
      const { fixture } = await setup();
      const cards = fixture.debugElement.queryAll(By.css('.kpi-card'));
      expect(cards.length).toBe(6);
    });

    it('cada KPI card debe tener label, value, trend e icon', async () => {
      const { component } = await setup();
      component.kpiCards.forEach(k => {
        expect(k.label).toBeTruthy();
        expect(k.value).toBeTruthy();
        expect(k.icon).toBeTruthy();
        expect(typeof k.trend).toBe('number');
      });
    });
  });

  // ── 3. Cambio de período ──────────────────────────────────────────────────
  describe('cambiarPeriodo()', () => {

    it('debería actualizar periodoSeleccionado', async () => {
      const { component } = await setup();
      component.cambiarPeriodo('Hoy');
      expect(component.periodoSeleccionado).toBe('Hoy');
    });

    it('debería activar cargando = true y luego false tras 600ms', fakeAsync(async () => {
      const { component } = await setup();
      component.cambiarPeriodo('Esta semana');

      expect(component.cargando).toBeTrue();
      tick(600);
      expect(component.cargando).toBeFalse();
    }));
  });

  // ── 4. Donut chart ────────────────────────────────────────────────────────
  describe('Donut chart', () => {

    it('debería calcular donutTotal como suma de todos los valores', async () => {
      const { component } = await setup();
      const esperado = component.donutData.reduce((sum, s) => sum + s.valor, 0);
      expect(component.donutTotal).toBe(esperado);
    });

    it('debería generar tantos ángulos como segmentos', async () => {
      const { component } = await setup();
      expect(component.donutAngulos.length).toBe(component.donutData.length);
    });

    it('donutSegmentos debería tener porcentaje calculado para cada segmento', async () => {
      const { component } = await setup();
      component.donutSegmentos.forEach(s => {
        expect(s.porcentaje).toBeGreaterThan(0);
        expect(s.porcentaje!).toBeLessThanOrEqual(100);
      });
    });

    it('buildArcPath() debería retornar un string SVG no vacío', async () => {
      const { component } = await setup();
      const path = component.buildArcPath(-90, 0);
      expect(path.trim().length).toBeGreaterThan(10);
    });

    it('onHoverSegmento() debería actualizar hoveredSegmento', async () => {
      const { component } = await setup();
      const seg = component.donutSegmentos[0];
      component.onHoverSegmento(seg);
      expect(component.hoveredSegmento).toBe(seg);

      component.onHoverSegmento(null);
      expect(component.hoveredSegmento).toBeNull();
    });
  });

  // ── 5. Gráfica de líneas ──────────────────────────────────────────────────
  describe('Gráfica de líneas', () => {

    it('graficaMaxVal debería ser mayor que el ingreso más alto', async () => {
      const { component } = await setup();
      const maxIngreso = Math.max(...component.graficaMeses.map(m => m.ingresos));
      expect(component.graficaMaxVal).toBeGreaterThan(maxIngreso);
    });

    it('generarPolyline("ingresos") debería devolver puntos separados por espacios', async () => {
      const { component } = await setup();
      const poly = component.generarPolyline('ingresos');
      expect(poly).toContain(',');
      expect(poly.split(' ').length).toBe(component.graficaMeses.length);
    });

    it('xPos() del último punto no debería superar graficaAncho', async () => {
      const { component } = await setup();
      const n = component.graficaMeses.length;
      const x = component.xPos(n - 1, n);
      expect(x).toBeLessThanOrEqual(component.graficaAncho);
    });
  });

  // ── 6. Tabla de ventas recientes ──────────────────────────────────────────
  describe('Tabla de ventas recientes', () => {

    it('debería inicializar ventasFiltradas con todos los registros', async () => {
      const { component } = await setup();
      expect(component.ventasFiltradas.length).toBe(component.ventasRecientes.length);
    });

    it('aplicarFiltro() debería filtrar por nombre de cliente', async () => {
      const { component } = await setup();
      component.filtroTabla = 'Carlos';
      component.aplicarFiltro();
      expect(component.ventasFiltradas.every(v => v.cliente.toLowerCase().includes('carlos'))).toBeTrue();
    });

    it('aplicarFiltro() debería filtrar por categoría', async () => {
      const { component } = await setup();
      component.filtroTabla = 'membresía';
      component.aplicarFiltro();
      expect(component.ventasFiltradas.every(v => v.categoria.toLowerCase().includes('membresía'))).toBeTrue();
    });

    it('aplicarFiltro() con filtro vacío devuelve todos los registros', async () => {
      const { component } = await setup();
      component.filtroTabla = 'xyz_no_existe';
      component.aplicarFiltro();
      expect(component.ventasFiltradas.length).toBe(0);

      component.filtroTabla = '';
      component.aplicarFiltro();
      expect(component.ventasFiltradas.length).toBe(component.ventasRecientes.length);
    });

    it('estadoClass() debería devolver clases correctas', async () => {
      const { component } = await setup();
      expect(component.estadoClass('completado')).toContain('status-completado');
      expect(component.estadoClass('pendiente')).toContain('status-pendiente');
      expect(component.estadoClass('cancelado')).toContain('status-cancelado');
    });
  });

  // ── 7. Top Productos ──────────────────────────────────────────────────────
  describe('Top Productos', () => {

    it('debería tener 5 productos en el placeholder', async () => {
      const { component } = await setup();
      expect(component.productosTop.length).toBe(5);
    });

    it('stockClass() debería devolver "stock-critico" para stock < 15', async () => {
      const { component } = await setup();
      expect(component.stockClass(5)).toBe('stock-critico');
    });

    it('stockClass() debería devolver "stock-bajo" para stock entre 15 y 29', async () => {
      const { component } = await setup();
      expect(component.stockClass(20)).toBe('stock-bajo');
    });

    it('stockClass() debería devolver "stock-ok" para stock >= 30', async () => {
      const { component } = await setup();
      expect(component.stockClass(50)).toBe('stock-ok');
    });
  });

  // ── 8. Utilidades de formato ──────────────────────────────────────────────
  describe('Utilidades de formato', () => {

    it('formatMoneda() debería incluir el símbolo S/', async () => {
      const { component } = await setup();
      expect(component.formatMoneda(1500)).toContain('S/');
    });

    it('trendClass() debería distinguir positivo, negativo y neutro', async () => {
      const { component } = await setup();
      expect(component.trendClass(5)).toBe('trend-up');
      expect(component.trendClass(-3)).toBe('trend-down');
      expect(component.trendClass(0)).toBe('trend-neutral');
    });

    it('trendIcon() debería devolver ▲, ▼ o —', async () => {
      const { component } = await setup();
      expect(component.trendIcon(10)).toBe('▲');
      expect(component.trendIcon(-5)).toBe('▼');
      expect(component.trendIcon(0)).toBe('—');
    });
  });

  // ── 9. Acciones del administrador ────────────────────────────────────────
  describe('Acciones del admin', () => {

    it('exportarReporte() debería ejecutarse sin lanzar errores', async () => {
      const { component } = await setup();
      expect(() => component.exportarReporte()).not.toThrow();
    });

    it('verDetalleVenta() debería ejecutarse sin lanzar errores', async () => {
      const { component } = await setup();
      expect(() => component.verDetalleVenta(1001)).not.toThrow();
    });
  });

  // ── 10. Destrucción y limpieza ────────────────────────────────────────────
  describe('Ciclo de vida', () => {

    it('ngOnDestroy() no debería lanzar error si no hay animFrameId', async () => {
      const { component } = await setup();
      (component as any).animFrameId = null;
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

});
