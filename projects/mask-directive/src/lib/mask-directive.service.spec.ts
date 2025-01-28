import { TestBed } from '@angular/core/testing';

import { MaskDirectiveService } from './mask-directive.service';

describe('MaskDirectiveService', () => {
  let service: MaskDirectiveService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MaskDirectiveService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
