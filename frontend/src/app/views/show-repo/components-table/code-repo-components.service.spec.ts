import {TestBed} from '@angular/core/testing';

import {CodeRepoComponentsService} from './code-repo-components.service';
import {HttpTestingController, provideHttpClientTesting} from "@angular/common/http/testing";
import {environment} from "../../../../environments/environment";
import {provideHttpClient} from "@angular/common/http";

describe('CodeRepoComponentsService', () => {

  let service: CodeRepoComponentsService;
  let httpMock: HttpTestingController;
  const baseUrl = environment.backendUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CodeRepoComponentsService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(CodeRepoComponentsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
