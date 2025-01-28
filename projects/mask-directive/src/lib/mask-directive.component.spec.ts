import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MaskDirectiveComponent } from './mask-directive.component';

describe('MaskDirectiveComponent', () => {
  let component: MaskDirectiveComponent;
  let fixture: ComponentFixture<MaskDirectiveComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MaskDirectiveComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MaskDirectiveComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
