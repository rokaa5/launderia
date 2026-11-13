import 'zone.js';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { AppComponent } from './app/app.component';
bootstrapApplication(AppComponent, {providers:[provideIonicAngular({mode:'md',animated:false,rippleEffect:false})]}).catch(console.error);

