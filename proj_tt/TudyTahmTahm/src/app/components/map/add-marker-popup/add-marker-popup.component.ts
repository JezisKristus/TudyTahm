import {Component, EventEmitter, Input, Output, ViewEncapsulation} from '@angular/core';
import * as L from 'leaflet';

@Component({
  selector: 'app-popup',
  standalone: true,
  templateUrl: './add-marker-popup.component.html',
  styleUrls: ['./add-marker-popup.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class AddMarkerPopupComponent {
  @Input() latlng!: L.LatLng;
  @Output() addMarker = new EventEmitter<L.LatLng>();

  onAddMarker(): void {
    this.addMarker.emit(this.latlng); // Emitujeme souřadnice markeru
  }
}
