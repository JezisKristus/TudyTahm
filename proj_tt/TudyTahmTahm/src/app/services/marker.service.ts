import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Marker } from '../models/marker';

@Injectable({
  providedIn: 'root'
})
export class MarkerService {

  public constructor(private http: HttpClient) {}

  public findAll(): Observable<Marker[]> {
    return this.http.get<Marker[]>('http://localhost:5131/api/Markers');
  }
  public findByMapId(id: number): Observable<Marker[]> {
    return this.http.get<Marker[]>('http://localhost:5131/api/Markers/Map/' + id);
  }
  public create(marker: Marker): Observable<Marker> {
    return this.http.post<Marker>('http://localhost:5131/api/Markers', marker);
  }
  public update(marker: Marker): Observable<Marker> {
    return this.http.put<Marker>('http://localhost:5131/api/Markers/' + marker.markerId, marker);
  }
  public delete(marker: Marker): Observable<void> {
    return this.http.delete<void>('http://localhost:5131/api/Markers/' + marker.markerId);
  }

}
