import { Component } from '@angular/core';
import {GPSPoint} from '../models/point';

@Component({
  selector: 'app-article',
  imports: [],
  templateUrl: './article.component.html',
  styleUrl: './article.component.scss'
})
export class ArticleComponent {
  Points: GPSPoint[] = [ { id: 1, latitude: 78.5724568, longitude: 57.863131}]

}
