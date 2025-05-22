import {Label} from '../models/label';
import {Injectable} from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { tap, map } from 'rxjs/operators';
import { CreateLabelDto } from '../models/dtos/create-label.dto';

@Injectable({
  providedIn: 'root'
})

export class LabelService{
  public constructor(private http: HttpClient) {}
  public getLabelsByMapID(id: number): Observable<Label[]> {
    console.log('Sending request with id:' + id);
    return this.http.get<Label[]>(`${environment.apiUrl}/Label/ByMapID/${id}`).pipe(
      tap(response => {
        console.log('Received response from API:', response);
        return response;
      })
    ); // Ready for multiple maps
  }
  public getLabelByLabelID(id: number): Observable<Label> {
    console.log('Sending request with id:' + id);
    return this.http.get<Label>(`${environment.apiUrl}/Label/ByLabelID/${id}`).pipe(
      tap(response => {
        console.log('Received response from API:', response);
        return response;
      })
    );
  }
  public createLabel(label: CreateLabelDto): Observable<Label> {
    console.log('Sending create request with data:', label);
    return this.http.post<Label>(`${environment.apiUrl}/Label`, label).pipe(
      tap(response => {
        console.log('Received response from API:', response);
        return response;
      })
    );
  }
  public updateLabel(label: Label): Observable<Label> {
    console.log('Updating label with data:', label);
    return this.http.put<Label>(`${environment.apiUrl}/Label/${label.labelID}`, label).pipe(
      tap(response => {
        console.log('Received updated label from API:', response);
        return response;
      })
    );
  }
  public deleteLabel(labelID : number): Observable<void> {
    if (labelID) {
      throw new Error('Label ID is required to delete a label.');
    }
    const url = `${environment.apiUrl}/Label/${labelID}`;
    console.log(`Sending DELETE request to: ${url}`);
    return this.http.delete<void>(url).pipe(
      tap(() => console.log(`Label with ID ${labelID} deleted successfully.`))
    );
  }
}
