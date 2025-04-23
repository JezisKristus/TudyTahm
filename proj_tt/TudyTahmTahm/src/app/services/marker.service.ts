import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Marker } from '../models/marker';
import { CreateUpdateMarkerDto } from '../models/create-marker-dto';
import { environment } from '../../environments/environment';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class MarkerService {

  public constructor(private http: HttpClient) {}

  public getMarkers(): Observable<Marker[]> {
    const url = `environment/Marker`;
    return this.http.get<Marker[]>(url).pipe(
      tap(markers => markers.filter(marker => this.isValidLatLng(marker.latitude, marker.longitude))) // Filtrování neplatných markerů
    );
  }

  public findBytapId(id: number): Observable<Marker[]> {
    return this.http.get<Marker[]>('environment/Marker/tap/' + id); // Připraveno až bude víc map
  }

  public create(createMarkerDto: CreateUpdateMarkerDto): Observable<Marker> {
    console.log('Sending create request with data:', createMarkerDto);
    return this.http.post<Marker>(`environment/Marker`, createMarkerDto).pipe(
      tap(response => {
        console.log('Received response from API:', response);
        return response;
      })
    );
  }

  public update(marker: Marker): Observable<Marker> {
    console.log('Updating marker with data:', marker);
    return this.http.put<Marker>(`environment/Marker/${marker.markerId}`, marker).pipe(
      tap(response => {
        console.log('Received updated marker from API:', response);
        return response;
      })
    );
  }

  public delete(marker: Marker): Observable<void> {
    return this.http.delete<void>('environment/Marker/' + marker.markerId);
  }


  private isValidLatLng(lat: number, lng: number): boolean {
    return typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng);
  }

}
