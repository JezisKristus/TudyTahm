import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-search',
  standalone: true,
  template: `
    <input
      type="text"
      [(ngModel)]="query"
      placeholder="Search for a place..."
      (keydown.enter)="onSearch()"
    />
    <button (click)="onSearch()">Search</button>
  `,
  imports: [FormsModule]
})
export class SearchComponent {
  @Output() search = new EventEmitter<string>();
  query: string = '';

  onSearch(): void {
    this.search.emit(this.query);
  }
}
