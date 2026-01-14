import { Routes } from '@angular/router';
import { ManualComponent } from './manual.component';

export const MANUAL_ROUTES: Routes = [
    {
        path: '',
        redirectTo: 'intro',
        pathMatch: 'full'
    },
    {
        path: ':docId',
        component: ManualComponent
    }
];
