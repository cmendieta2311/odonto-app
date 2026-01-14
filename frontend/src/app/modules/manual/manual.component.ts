import { Component, OnInit, HostListener } from '@angular/core';
import { MarkdownModule } from 'ngx-markdown';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';

@Component({
    selector: 'app-manual',
    standalone: true,
    imports: [CommonModule, MarkdownModule, RouterModule],
    templateUrl: './manual.html',
    styles: []
})
export class ManualComponent implements OnInit {
    currentDoc: string = 'intro';

    topics = [
        { id: 'intro', title: 'Introducción', icon: 'heroicons-outline-home' },
        { id: 'patients', title: 'Gestión de Pacientes', icon: 'heroicons-outline-user-group' },
        { id: 'agenda', title: 'Agenda y Turnos', icon: 'heroicons-outline-calendar' },
        { id: 'billing', title: 'Facturación', icon: 'heroicons-outline-currency-dollar' },
        { id: 'config', title: 'Configuración', icon: 'heroicons-outline-cog' }
    ];

    constructor(
        private route: ActivatedRoute,
        private router: Router
    ) { }

    ngOnInit() {
        this.route.paramMap.subscribe(params => {
            const docId = params.get('docId');
            if (docId) {
                this.currentDoc = docId;
            }
        });
    }

    selectTopic(id: string) {
        this.router.navigate(['/manual', id]);
    }

    // Intercept clicks on links rendered by markdown to use Angular Router
    @HostListener('click', ['$event'])
    onClick(e: MouseEvent) {
        const target = e.target as HTMLElement;
        // Check if the click is on an anchor tag
        const anchor = target.closest('a');

        if (anchor) {
            const href = anchor.getAttribute('href');
            // If it's an internal link starting with /manual
            if (href && href.startsWith('/manual')) {
                e.preventDefault();
                this.router.navigateByUrl(href);
            }
        }
    }
}
