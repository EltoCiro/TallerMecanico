import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonTabs,
  IonTabBar,
  IonTabButton,
  IonIcon,
  IonLabel,
  IonBadge
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  peopleOutline,
  documentTextOutline,
  clipboardOutline,
  cubeOutline,
  personOutline,
  cartOutline,
  statsChartOutline,
  settingsOutline
} from 'ionicons/icons';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-tabs',
  templateUrl: './tabs.page.html',
  styleUrls: ['./tabs.page.scss'],
  imports: [
    CommonModule,
    IonTabs,
    IonTabBar,
    IonTabButton,
    IonIcon,
    IonLabel,
    IonBadge
  ]
})
export class TabsPage implements OnInit {
  userRole: string = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    addIcons({
      peopleOutline,
      documentTextOutline,
      clipboardOutline,
      cubeOutline,
      personOutline,
      cartOutline,
      statsChartOutline,
      settingsOutline
    });
  }

  ngOnInit() {
    const user = this.authService.getCurrentUser();
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }
    this.userRole = user.rol;
  }

  canAccessTab(requiredRoles: string[]): boolean {
    return requiredRoles.includes(this.userRole);
  }
}
