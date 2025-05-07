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

  public getJourneyByMapID

}
