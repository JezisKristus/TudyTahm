import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface SearchResult {
  display_name: string;
  lat: number;
  lon: number;
}

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './searchbar.component.html',
  styleUrls: ['./search.component.scss'],
})
export class SearchComponent {
  @Output() search = new EventEmitter<string>();
  @Output() locationSelected = new EventEmitter<{lat: number, lon: number, name: string}>();

  searchQuery: string = '';
  suggestions: SearchResult[] = [];
  showSuggestions: boolean = false;
  private debounceTimer?: any;

  onSearchInput(): void {
    clearTimeout(this.debounceTimer);

    if (this.searchQuery.length < 3) {
      this.suggestions = [];
      return;
    }

    this.debounceTimer = setTimeout(() => {
      this.fetchSuggestions();
    }, 300);
  }

  private async fetchSuggestions(): Promise<void> {
    const query = encodeURIComponent(this.searchQuery);
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=5`;

    try {
      const response = await fetch(url);
      this.suggestions = await response.json();
    } catch (error) {
      console.error('Chyba při načítání návrhů:', error);
      this.suggestions = [];
    }
  }

  selectSuggestion(suggestion: SearchResult): void {
    this.searchQuery = suggestion.display_name;
    this.showSuggestions = false;
    this.locationSelected.emit({
      lat: Number(suggestion.lat),
      lon: Number(suggestion.lon),
      name: suggestion.display_name
    });
  }
}
