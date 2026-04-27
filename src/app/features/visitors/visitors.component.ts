import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-visitors',
  templateUrl: './visitors.component.html',
  styleUrls: ['./visitors.component.css'],
  imports: [CommonModule]
})
export class VisitorsComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
