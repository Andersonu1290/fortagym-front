import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductosEliminados } from './productos-eliminados';

describe('ProductosEliminados', () => {
  let component: ProductosEliminados;
  let fixture: ComponentFixture<ProductosEliminados>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductosEliminados]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductosEliminados);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
