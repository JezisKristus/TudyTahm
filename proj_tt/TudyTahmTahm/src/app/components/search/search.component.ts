import { Component, EventEmitter, Output, HostListener } from '@angular/core';
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
  selectedIndex: number = -1;
  private debounceTimer?: any;

  handleKeydown(event: KeyboardEvent): void {
    if (!this.showSuggestions) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.selectedIndex = Math.min(this.selectedIndex + 1, this.suggestions.length - 1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.selectedIndex = Math.max(this.selectedIndex - 1, -1);
        break;
      case 'Enter':
        event.preventDefault();
        if (this.selectedIndex >= 0) {
          this.selectSuggestion(this.suggestions[this.selectedIndex]);
        }
        break;
      case 'Escape':
        this.showSuggestions = false;
        this.selectedIndex = -1;
        break;
    }
  }

  onSearchInput(): void {
    clearTimeout(this.debounceTimer);
    this.selectedIndex = -1;

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
      this.showSuggestions = true;
    } catch (error) {
      console.error('Chyba při načítání návrhů:', error);
      this.suggestions = [];
    }
  }

  selectSuggestion(suggestion: SearchResult): void {
    this.searchQuery = suggestion.display_name;
    this.showSuggestions = false;
    this.selectedIndex = -1;
    this.locationSelected.emit({
      lat: Number(suggestion.lat),
      lon: Number(suggestion.lon),
      name: suggestion.display_name
    });
  }

  @HostListener('document:click', ['$event'])
  onClick(event: Event): void {
    if (!(event.target as HTMLElement).closest('.search-container')) {
      this.showSuggestions = false;
      this.selectedIndex = -1;
    }
  }
}
