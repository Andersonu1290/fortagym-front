import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MisPlanes } from './mis-planes';

describe('MisPlanes', () => {
  let component: MisPlanes;
  let fixture: ComponentFixture<MisPlanes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MisPlanes]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MisPlanes);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
