import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ProductoService } from '../../../../services/producto.service';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-productos-eliminados',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './productos-eliminados.html',
  styleUrls: ['./productos-eliminados.scss']
})
export class ProductosEliminados implements OnInit {

  productos: any[] = [];
  productosFiltrados: any[] = [];

  filtroCategoria: string = 'Todos';
  textoBusqueda: string = '';

  metricas = {
    total: 0,
    agotados: 0,
    valor: 0,
    categorias: 0
  };

  constructor(private productoService: ProductoService) {}

  ngOnInit(): void {
    this.cargarProductosEliminados();
  }

  cargarProductosEliminados() {
    this.productoService.getProductosEliminados().subscribe({
      next: (data) => {
        this.productos = data;
        this.aplicarFiltros();
        this.calcularMetricas();
      },
      error: (err) => console.error('Error cargando productos eliminados', err)
    });
  }

  calcularMetricas() {
    this.metricas.total = this.productos.length;

    this.metricas.agotados =
      this.productos.filter(p => p.stock === 0).length;

    this.metricas.valor =
      this.productos.reduce((acc, p) => acc + (p.precio * p.stock), 0);

    this.metricas.categorias =
      new Set(this.productos.map(p => p.categoria)).size;
  }

  seleccionarCategoria(categoria: string) {
    this.filtroCategoria = categoria;
    this.aplicarFiltros();
  }

  aplicarFiltros() {

    let temp = [...this.productos];

    if (this.filtroCategoria !== 'Todos') {
      temp = temp.filter(
        p => p.categoria.toUpperCase() === this.filtroCategoria.toUpperCase()
      );
    }

    if (this.textoBusqueda.trim()) {

      const texto = this.textoBusqueda.toLowerCase();

      temp = temp.filter(p =>
        p.nombre.toLowerCase().includes(texto) ||
        p.descripcion.toLowerCase().includes(texto)
      );
    }

    this.productosFiltrados = temp;
  }

  restaurarProducto(id: number) {

    if (!confirm('¿Deseas restaurar este producto?')) {
      return;
    }

    this.productoService.restaurarProducto(id).subscribe({

      next: () => {
        alert('✅ Producto restaurado correctamente');
        this.cargarProductosEliminados();
      },

      error: (err) => {
        console.error(err);
        alert('❌ No se pudo restaurar el producto');
      }

    });

  }

  eliminarDefinitivamente(id: number) {

    if (!confirm('⚠️ Esta acción eliminará el producto permanentemente. ¿Deseas continuar?')) {
      return;
    }

    this.productoService.eliminarProductoDefinitivo(id).subscribe({

      next: () => {
        alert('🗑️ Producto eliminado definitivamente');
        this.cargarProductosEliminados();
      },

      error: (err) => {
        console.error(err);
        alert('❌ No se pudo eliminar el producto');
      }

    });

  }

  getImagenUrl(img: string): string {

    if (!img) return '';

    if (img.startsWith('http')) {
      return img;
    }

    if (img.startsWith('/uploads/')) {
      return `${environment.apiUrl}${img}`;
    }

    return `${environment.apiUrl}/uploads/${img}`;
  }

}
