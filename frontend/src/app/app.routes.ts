import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login';
import { MainLayoutComponent } from './layout/main-layout/main-layout';
import { AuthGuard } from './auth/auth-guard';

export const routes: Routes = [
    { path: 'login', component: LoginComponent },
    {
        path: 'register',
        loadComponent: () => import('./auth/register/register').then(m => m.RegisterComponent)
    },
    {
        path: '',
        component: MainLayoutComponent,
        canActivate: [AuthGuard],
        children: [
            {
                path: 'profile',
                loadComponent: () => import('./modules/profile/profile').then(m => m.ProfileComponent)
            },
            {
                path: 'admin/users',
                loadComponent: () => import('./modules/admin/users/user-list/user-list').then(m => m.UserListComponent)
            },
            {
                path: 'admin/catalog',
                loadComponent: () => import('./modules/catalog/service-list/service-list').then(m => m.ServiceListComponent)
            },
            {
                path: 'admin/catalog/new',
                loadComponent: () => import('./modules/catalog/service-form/service-form').then(m => m.ServiceFormComponent)
            },
            {
                path: 'admin/catalog/edit/:id',
                loadComponent: () => import('./modules/catalog/service-form/service-form').then(m => m.ServiceFormComponent)
            },
            {
                path: 'reception/patients',
                children: [
                    {
                        path: '',
                        loadComponent: () => import('./modules/patients/patient-list/patient-list').then(m => m.PatientListComponent)
                    },
                    {
                        path: 'new',
                        loadComponent: () => import('./modules/patients/patient-form/patient-form').then(m => m.PatientFormComponent)
                    },
                    {
                        path: 'edit/:id',
                        loadComponent: () => import('./modules/patients/patient-form/patient-form').then(m => m.PatientFormComponent)
                    }
                ]
            },
            {
                path: 'commercial/quotes',
                children: [
                    {
                        path: '',
                        loadComponent: () => import('./modules/quotes/quote-list/quote-list').then(m => m.QuoteListComponent)
                    },
                    {
                        path: 'new',
                        loadComponent: () => import('./modules/quotes/quote-form/quote-form').then(m => m.QuoteFormComponent)
                    },
                    {
                        path: 'edit/:id',
                        loadComponent: () => import('./modules/quotes/quote-form/quote-form').then(m => m.QuoteFormComponent)
                    }
                ]
            },
            {
                path: 'commercial/contracts',
                children: [
                    {
                        path: '',
                        loadComponent: () => import('./modules/contracts/contract-list/contract-list').then(m => m.ContractListComponent)
                    },
                    {
                        path: 'generate/:quoteId',
                        loadComponent: () => import('./modules/contracts/contract-form/contract-form').then(m => m.ContractFormComponent)
                    },
                    {
                        path: 'view/:contractId',
                        loadComponent: () => import('./modules/contracts/contract-form/contract-form').then(m => m.ContractFormComponent)
                    }
                ]
            },
            {
                path: 'configuration',
                loadComponent: () => import('./modules/configuration/configuration').then(m => m.ConfigurationComponent),
                children: [
                    { path: '', redirectTo: 'general', pathMatch: 'full' },
                    {
                        path: 'general',
                        loadComponent: () => import('./modules/configuration/pages/config-general/config-general').then(m => m.ConfigGeneralComponent)
                    },
                    {
                        path: 'billing',
                        loadComponent: () => import('./modules/configuration/pages/config-billing/config-billing').then(m => m.ConfigBillingComponent)
                    },
                    {
                        path: 'catalog',
                        children: [
                            { path: 'areas', loadComponent: () => import('./modules/configuration/pages/config-services/config-services').then(m => m.ConfigServicesComponent) },
                            { path: 'categories', loadComponent: () => import('./modules/configuration/pages/config-services/config-services').then(m => m.ConfigServicesComponent) },
                            { path: 'services', loadComponent: () => import('./modules/catalog/service-list/service-list').then(m => m.ServiceListComponent) }
                        ]
                    },
                    {
                        path: 'users',
                        loadComponent: () => import('./modules/admin/users/user-list/user-list').then(m => m.UserListComponent)
                    },
                    {
                        path: 'printing',
                        loadComponent: () => import('./modules/configuration/pages/config-printing/config-printing').then(m => m.ConfigPrintingComponent)
                    },
                    {
                        path: 'offices',
                        loadComponent: () => import('./modules/configuration/offices/office-list/office-list').then(m => m.OfficeList)
                    }
                ]
            },
            {
                path: 'payments',
                children: [
                    {
                        path: '',
                        loadComponent: () => import('./modules/payments/payment-list/payment-list').then(m => m.PaymentListComponent)
                    },
                    {
                        path: 'new',
                        loadComponent: () => import('./modules/payments/payment-registration/payment-registration').then(m => m.PaymentRegistrationComponent)
                    }
                ]
            },
            {
                path: 'admin/invoices',
                children: [
                    {
                        path: '',
                        loadComponent: () => import('./modules/invoices/invoice-list/invoice-list').then(m => m.InvoiceListComponent)
                    },
                    {
                        path: 'new',
                        loadComponent: () => import('./modules/invoices/invoice-form/invoice-form').then(m => m.InvoiceFormComponent)
                    },
                    {
                        path: ':id',
                        loadComponent: () => import('./modules/invoices/invoice-detail/invoice-detail').then(m => m.InvoiceDetailComponent)
                    }
                ]
            }
        ]
    },
    { path: '**', redirectTo: '' }
];
