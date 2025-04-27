import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { AppMarker } from '../models/appMarker';
import { CreateUpdateMarkerDto } from '../models/create-marker-dto';
import { environment } from '../../environments/environment';
import { tap, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class MarkerService {

  public constructor(private http: HttpClient) {}

  public getMarkers(): Observable<AppMarker[]> {
    const url = `${environment.apiUrl}/Marker`;
    return this.http.get<any[]>(url, { responseType: 'json' }).pipe(
      map(markers => {
        if (!Array.isArray(markers)) {
          throw new Error('Invalid response format: Expected an array of markers');
        }
        // Přemapování: očekáváme, že API vrací markerID, který chceme převést na markerId
        return markers.map(marker => ({
          ...marker,
          markerId: marker.markerID  // zde bereme marker.markerID z API
        }) as AppMarker).filter(marker => this.isValidLatLng(marker.latitude, marker.longitude));
      }),
      tap({
        error: (err) => console.error('Error parsing markers:', err)
      })
    );
  }


  public findBytapId(id: number): Observable<AppMarker[]> {
    return this.http.get<AppMarker[]>('environment/Marker/tap/' + id); // Ready for multiple maps
  }

  public create(createMarkerDto: CreateUpdateMarkerDto): Observable<AppMarker> {
    console.log('Sending create request with data:', createMarkerDto);
    return this.http.post<AppMarker>(`${environment.apiUrl}/Marker`, createMarkerDto).pipe(
      tap(response => {
        console.log('Received response from API:', response);
        return response;
      })
    );
  }

  public update(marker: AppMarker): Observable<AppMarker> {
    console.log('Updating marker with data:', marker);
    return this.http.put<AppMarker>(`${environment.apiUrl}/Marker/${marker.markerId}`, marker).pipe(
      tap(response => {
        console.log('Received updated marker from API:', response);
        return response;
      })
    );
  }

  public delete(marker: AppMarker): Observable<void> {
    if (!marker.markerId) {
      throw new Error('Marker ID is required to delete a marker.');
    }
    const url = `${environment.apiUrl}/Marker/${marker.markerId}`;
    console.log(`Sending DELETE request to: ${url}`);
    return this.http.delete<void>(url).pipe(
      tap(() => console.log(`Marker with ID ${marker.markerId} deleted successfully.`))
    );
  }

  private isValidLatLng(lat: number, lng: number): boolean {
    return typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng);
  }
}
