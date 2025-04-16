import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import * as L from 'leaflet';
import {NgForOf, NgOptimizedImage} from '@angular/common';
import {LeafletModule} from '@bluehalo/ngx-leaflet';

@Component({
  selector: 'app-marker-details',
  standalone: true,
  templateUrl: './marker-details.component.html',
  styleUrls: ['./marker-details.component.scss'],
  imports: [
    NgOptimizedImage,
    NgForOf,
    LeafletModule
  ],
})

export class MarkerDetailsComponent implements OnChanges {
  @Input() marker: L.Marker | null = null; // Input for the selected marker

  // Array of icon URLs for the icon grid
  icons: string[] = [
    'assets/icons/icon1.png',
    'assets/icons/icon2.png',
    'assets/icons/icon3.png',
    'assets/icons/icon4.png'
  ];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['marker'] && changes['marker'].currentValue) {
      console.log('Selected marker updated:', this.marker);
    }
  }
}
