import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-configuration',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './configuration.html',
    styleUrl: './configuration.css'
})
export class ConfigurationComponent { }

