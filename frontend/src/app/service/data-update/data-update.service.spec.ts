import {TestBed} from '@angular/core/testing';

import {DataUpdateService} from './data-update.service';
import {HttpTestingController, provideHttpClientTesting} from "@angular/common/http/testing";
import {environment} from "../../../environments/environment";
import {provideHttpClient} from "@angular/common/http";

describe('DataUpdateService', () => {

  let service: DataUpdateService;
  let httpMock: HttpTestingController;
  const baseUrl = environment.backendUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        DataUpdateService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(DataUpdateService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
