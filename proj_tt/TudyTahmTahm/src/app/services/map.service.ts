import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { AppMarker } from '../models/appMarker';
import { environment } from '../../environments/environment';
import { tap, map } from 'rxjs/operators';
import {Map} from '../models/map';

@Injectable({
  providedIn: 'root'
})
export class MapService {

  public constructor(private http: HttpClient) {}

  public getMapById (id: number): Observable<Map>{
      return this.http.get<Map>('environment/api/Map/ByMapID/' + id);
  }

}
