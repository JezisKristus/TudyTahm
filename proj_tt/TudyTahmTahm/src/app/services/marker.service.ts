import {Injectable} from '@angular/core';
import {Observable, of} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {AppMarker, BackendMarker} from '../models/appMarker';
import {CreateUpdateMarkerDto} from '../models/dtos/create-marker.dto';
import {environment} from '../../environments/environment';
import {map, tap, switchMap} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class MarkerService {

  public constructor(private http: HttpClient) {
  }

  public getMarkersByMapId(id: number): Observable<AppMarker[]> {
    console.log('Getting markers from map with ID :' + id);
    return this.http.get<AppMarker[]>(`${environment.apiUrl}/Marker/ByMapID/${id}`); // Ready for multiple maps
  }

  public getMarkerByMarkerID(id: number): Observable<AppMarker> {
    console.log('Sending create request with id:' + id);
    return this.http.get<AppMarker>(`${environment.apiUrl}/Marker/ByMarkerID/${id}`).pipe(
      tap(response => {
        console.log('Received response from API:', response);
        return response;
      })
    );
  }

  public createMarker(createMarkerDto: CreateUpdateMarkerDto): Observable<AppMarker> {
    console.log('Sending create request with data:', createMarkerDto);
    return this.http.post<BackendMarker | null>(`${environment.apiUrl}/Marker/${createMarkerDto.idMap}`, createMarkerDto).pipe(
      switchMap(response => {
        if (!response) {
          // fallback, unchanged
          return this.getMarkersByMapId(createMarkerDto.idMap).pipe(
            map(markers => {
              const newMarker = markers.find(m =>
                Math.abs(m.latitude - createMarkerDto.latitude) < 0.0000001 &&
                Math.abs(m.longitude - createMarkerDto.longitude) < 0.0000001
              );
              if (!newMarker) {
                throw new Error('Created marker not found in the updated list');
              }
              return newMarker;
            })
          );
        }

        // Map BackendMarker to AppMarker here
        const normalizedMarker: AppMarker = {
          markerID: response.markerID,
          idMap: response.idMap,
          idLabel: response.idLabel,
          markerName: response.markerName,
          markerDescription: response.markerDescription,
          latitude: response.gpsPoint.latitude,
          longitude: response.gpsPoint.longitude,
        };

        return of(normalizedMarker);
      }),
      tap(result => {
        console.log('Final marker data:', result);
      })
    );
  }


  public updateMarker(marker: AppMarker): Observable<AppMarker> {
    console.log('Updating marker with data:', marker);
    return this.http.put<AppMarker>(`${environment.apiUrl}/Marker/${marker.markerID}`, marker).pipe(
      tap(response => {
        console.log('Received updated marker from API:', response);
        return response;
      })
    );
  }

  public deleteMarker(marker: AppMarker): Observable<void> {
    if (!marker.markerID) {
      throw new Error('Marker ID is required to delete a marker.');
    }
    const url = `${environment.apiUrl}/Marker/${marker.markerID}`;
    console.log(`Sending DELETE request to: ${url}`);
    return this.http.delete<void>(url).pipe(
      tap(() => console.log(`Marker with ID ${marker.markerID} deleted successfully.`))
    );
  }
}
