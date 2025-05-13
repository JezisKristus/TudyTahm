import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {AppMarker} from '../models/appMarker';
import {CreateUpdateMarkerDto} from '../models/dtos/create-marker.dto';
import {environment} from '../../environments/environment';
import {tap} from 'rxjs/operators';

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
    return this.http.put<AppMarker>(`${environment.apiUrl}/Marker/${marker.markerID}`, marker).pipe(
      tap(response => {
        console.log('Received updated marker from API:', response);
        return response;
      })
    );
  }

  public delete(marker: AppMarker): Observable<void> {
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
