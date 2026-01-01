import { Component, inject } from '@angular/core';
import { AuthService } from '../../auth/auth.service';
import { RouterLink } from '@angular/router';
import { BrandLogoComponent } from '../../shared/components/brand-logo/brand-logo.component';

@Component({
  selector: 'app-nav-bar',
  standalone: true,
  imports: [BrandLogoComponent, RouterLink],
  templateUrl: './nav-bar.html',
  styleUrl: './nav-bar.css'
})
export class NavBarComponent {
  authService = inject(AuthService);

  logout() {
    this.authService.logout();
  }
}
