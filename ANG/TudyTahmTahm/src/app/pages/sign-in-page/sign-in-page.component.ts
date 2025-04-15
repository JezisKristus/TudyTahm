import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from "@angular/router";
import {FormBuilder, FormGroup} from '@angular/forms';

@Component({
  selector: 'app-sign-in-page',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './sign-in-page.component.html',
  styleUrl: './sign-in-page.component.scss'
})
export class SignInPageComponent {
  form: FormGroup;

  public constructor(private fb:FormBuilder) {

  }
}
