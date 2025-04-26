import {Component} from '@angular/core';
import {CommonModule} from '@angular/common';
import {SidebarComponent} from '../../components/sidebar/sidebar.component';

@Component({
  selector: 'app-shared-page',
  standalone: true,
  imports: [CommonModule, SidebarComponent],
  templateUrl: './shared-page.component.html',
  styleUrl: './shared-page.component.scss'
})
export class SharedPageComponent {
  // Mock data for demonstration
  groups = [
    { name: 'Group 1', active: true },
    { name: 'Group 2', active: false }
  ];

  sharedMaps = [
    {
      title: 'Journey to the marketplace',
      author: 'Petr Svab',
      description: 'Exploring the world with Filip Nprune',
      thumbnail: 'journey-picture.png'
    },
    {
      title: 'Journey to Trosky',
      author: 'Jan Novak',
      description: '',
      thumbnail: 'journey-picture.png'
    }
  ];
}
