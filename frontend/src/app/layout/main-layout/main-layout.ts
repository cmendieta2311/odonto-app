import { Component, inject, DestroyRef } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { NavBarComponent } from '../nav-bar/nav-bar';
import { AuthService } from '../../auth/auth.service';
import { BrandLogoComponent } from '../../shared/components/brand-logo/brand-logo.component';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs/operators';

export interface MenuItem {
  label: string;
  icon?: string;
  route?: string;
  children?: MenuItem[];
}

export interface MenuGroup {
  title: string;
  items: MenuItem[];
}

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, NavBarComponent, BrandLogoComponent],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.css'
})
export class MainLayoutComponent {
  authService = inject(AuthService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  mobileMenuOpen = false;

  constructor() {
    // Close mobile menu on any navigation
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      this.closeMobileMenu();
    });
  }

  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  closeMobileMenu() {
    this.mobileMenuOpen = false;
  }

  mainMenu: MenuGroup[] = [
    {
      title: 'CLÍNICA',
      items: [
        { label: 'Dashboard', icon: 'dashboard', route: '/dashboard' },
        { label: 'Agenda', icon: 'calendar_month', route: '/agenda' },
        { label: 'Pacientes', icon: 'group', route: '/reception/patients' },
        // { label: 'Servicios', icon: 'medical_services', route: '/admin/catalog' }
      ]
    },
    {
      title: 'FINANZAS',
      items: [
        { label: 'Presupuestos', icon: 'receipt_long', route: '/commercial/quotes' },
        { label: 'Contratos', icon: 'description', route: '/commercial/contracts' },
        { label: 'Cobros', icon: 'payments', route: '/payments' },
        { label: 'Facturación', icon: 'receipt_long', route: '/admin/invoices' },
        { label: 'Caja', icon: 'point_of_sale', route: '/admin/cash' }
      ]
    },
    {
      title: 'OTROS',
      items: [
        { label: 'Mi Perfil', icon: 'person', route: '/profile' },
        { label: 'Configuración', icon: 'settings', route: '/configuration/general' }
      ]
    }
  ];

  configMenu: MenuGroup[] = [
    {
      title: 'CONFIGURACIÓN',
      items: [
        { label: 'Clínica', icon: 'settings', route: '/configuration/general' },
        { label: 'Facturación', icon: 'receipt_long', route: '/configuration/billing' },
        { label: 'Métodos de Pago', icon: 'payments', route: '/configuration/payment-methods' },
        {
          label: 'Catálogo de Servicios',
          icon: 'category',
          children: [
            { label: 'Áreas y Categorías', route: '/configuration/catalog/areas' },
            { label: 'Servicios', route: '/configuration/catalog/services' }
          ]
        },
        { label: 'Usuarios y Roles', icon: 'manage_accounts', route: '/configuration/users' },
        { label: 'Profesionales', icon: 'dentistry', route: '/configuration/professionals' },
        { label: 'Impresión', icon: 'print', route: '/configuration/printing' }
      ]
    },
    {
      title: 'SISTEMA',
      items: [
        { label: 'Volver al Menú Principal', icon: 'arrow_back', route: '/dashboard' }
      ]
    }
  ];

  get menuGroups(): MenuGroup[] {
    return this.router.url.startsWith('/configuration') ? this.configMenu : this.mainMenu;
  }

  logout() {
    this.authService.logout();
  }
}
