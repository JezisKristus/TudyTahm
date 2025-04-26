import {Component} from '@angular/core';
import {Router, RouterLink, RouterLinkActive} from "@angular/router";
import {FormBuilder, FormGroup, ReactiveFormsModule} from '@angular/forms';
import {catchError} from 'rxjs';
import {AuthenticationService} from '../../services/authentication.service';
import {NgIf} from '@angular/common';

@Component({
  selector: 'app-sign-in-page',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    ReactiveFormsModule,
    NgIf
  ],
  templateUrl: './sign-in-page.component.html',
  styleUrl: './sign-in-page.component.scss'
})
export class SignInPageComponent {
  form: FormGroup;
  message: boolean = false;

  public constructor(private fb:FormBuilder, private router: Router, private authentication: AuthenticationService) {
    this.form  = this.fb.group({
      username: '',
      password: ''
    });
  }

  public save(): void {
    this.message = false;

    this.authentication.login(this.form.value).pipe(
      catchError(error => {
        this.message = true;
        throw error;
      })
    ).subscribe(result => this.router.navigate([ '/' ]));
  }
}
