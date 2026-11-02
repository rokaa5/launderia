
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular/lazy';

import { HomePageRoutingModule } from './home-routing.module';
import { HomePage } from './home.page';
import { FeedbackModalComponent } from './feedback-modal.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    HomePageRoutingModule
  ],
  declarations: [HomePage, FeedbackModalComponent]
})
export class HomePageModule {}
