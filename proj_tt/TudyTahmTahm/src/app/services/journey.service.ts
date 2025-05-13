import {Journey} from '../models/journey';
import {Injectable} from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { tap, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class JourneyService {

  public constructor(private http: HttpClient) {}

  public getJourneyByMapID(mapID: number): Observable<Journey[]> {
    return this.http.get<Journey[]>(`${environment.apiUrl}/Journey/ByMapID/${mapID}`)
      .pipe(
        tap((response) => console.log('Journey response:', response)),
        map((response) => response.map((journey) => ({
          ...journey,
          IDMap: mapID
        })))
      );
  }
  public getJourneyByUserID(userID: number): Observable<Journey[]> {
    return this.http.get<Journey[]>(`${environment.apiUrl}/Journey/ByUserID/${userID}`)
      .pipe(
        tap((response) => console.log('Journey response:', response))
      );
  }

  public createJourney(journey: Journey): Observable<Journey> {
    return this.http.post<Journey>(`${environment.apiUrl}/Journey`, journey)
      .pipe(
        tap((response) => console.log('Created Journey:', response))
      );
  }

  public addPointToJourney(jourID: number, point: any): Observable<any> {
    return this.http.put<any>(`${environment.apiUrl}/Journey/AddPointToJourney/${jourID}`, point)
      .pipe(
        tap((response) => console.log('Added Point to Journey:', response))
      );
  }

  public removePointFromJourney(jourID: number, pointID: number): Observable<any> {
    return this.http.delete<any>(`${environment.apiUrl}/Journey/PointFromJourney/${jourID}?pointID=${pointID}`)
      .pipe(
        tap((response) => console.log('Removed Point from Journey:', response))
      );
  }

  public deleteJourney(id: number): Observable<any> {
    return this.http.delete<any>(`${environment.apiUrl}/Journey/${id}`)
      .pipe(
        tap((response) => console.log('Deleted Journey:', response))
      );
  }

  public getPointsByJourneyID(jourID: number): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/Journey/Points/${jourID}`)
      .pipe(
        tap((response) => console.log('Points for Journey:', response))
      );
  }
}
