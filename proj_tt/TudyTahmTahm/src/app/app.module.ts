import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { routes } from './app.routes';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogModule } from '@angular/material/dialog';
import { NgOptimizedImage } from '@angular/common';

@NgModule({
  declarations: [

  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    RouterModule.forRoot(routes),
    BrowserAnimationsModule, // Required for Angular Material
    MatDialogModule, // Ensure this is imported
    NgOptimizedImage // Import NgOptimizedImage for optimized image handling
  ],
  providers: [],
  bootstrap: []
})
export class AppModule { }
