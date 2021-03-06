import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { BaseRequestOptions, Http, Response, ResponseOptions } from '@angular/http';
import { MockBackend, MockConnection } from '@angular/http/testing';
import { Observable } from 'rxjs/Observable';

import { HttpHandlerService } from './http_handler.service';
import {CacheService} from './cache.service';

const makeObserver = () => jasmine.createSpyObj('observer', ['error']);

describe('HttpHandlerService', () => {
  let httpHandlerService: HttpHandlerService;
  let mockBackend: MockBackend;
  let lastConnection: MockConnection;


  beforeEach(() => {
    mockBackend = new MockBackend();
    const fakeHttp = new Http(mockBackend, new BaseRequestOptions());
    const cache = new CacheService();
    httpHandlerService = new HttpHandlerService(fakeHttp, cache);
    mockBackend.connections.subscribe(
      (connection: MockConnection) => lastConnection = connection);


    TestBed.configureTestingModule({
      imports: [HttpHandlerService],
      providers: [
        { provide: Http, useValue: fakeHttp },
        HttpHandlerService,
      ],
    });

    window.sessionStorage.clear();
  });

  it('should be able to make http requests', fakeAsync(() => {
    const url = '/sample/endpoint';
    const expectedUrl = 'api/locations/sample/endpoint';
    const requestBody = '{"some-key": "some-value"}';

    mockBackend.connections.subscribe((connection: MockConnection) => {
      connection.mockRespond(new Response(new ResponseOptions({
        body: JSON.stringify({ data: requestBody }),
      })));

      httpHandlerService.get(url).subscribe(res => {
        expect(res).toEqual(requestBody);
      });
      expect(connection.request.url).toMatch(expectedUrl, 'url invalid');
    });

  }));

  it('should be able to return duplicate request from cache', () => {
    const originalCacheValue = 'original cache value';
    const url = '/some/endpoint';
    const objToStore: any = { data: originalCacheValue };

    mockBackend.connections.subscribe((connection: MockConnection) => {
      connection.mockRespond(new Response(new ResponseOptions({
        body: JSON.stringify(objToStore),
      })));

      // initiate an initial request whose result is automatically cached
      httpHandlerService.get(httpHandlerService.host(url)).subscribe(res => {
        expect(res).toEqual(objToStore);

        // next request should be returned from cache
        httpHandlerService.get(url).subscribe(res2 => {
          expect(connection).toBeUndefined();
          expect(res2).toEqual(objToStore);
        });
      });
    });
  });

});
