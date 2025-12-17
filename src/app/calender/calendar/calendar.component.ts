import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss']
})
export class CalendarComponent implements OnInit {

  weekDays = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  months = [
    'Jan','Feb','Mar','Apr','May','June',
    'July','Aug','Sep','Oct','Novr','Dec'
  ];

  calendarDays: any[] = [];

  currentMonth!: number;
  currentYear!: number;

  ngOnInit() {
    const today = new Date();
    this.currentMonth = today.getMonth();
    this.currentYear = today.getFullYear();

    this.generateCalendar();
  }

  generateCalendar() {
    const firstDay = new Date(this.currentYear, this.currentMonth, 1).getDay();
    const totalDays = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();

    this.calendarDays = [];

    // Empty cells before 1st day
    for (let i = 0; i < firstDay; i++) {
      this.calendarDays.push({ currentMonth: false });
    }

    for (let d = 1; d <= totalDays; d++) {
      const today = new Date();

      this.calendarDays.push({
        date: d,
        currentMonth: true,
        isToday:
          d === today.getDate() &&
          this.currentMonth === today.getMonth() &&
          this.currentYear === today.getFullYear()
      });
    }
  }

  prevMonth() {
    if (this.currentMonth === 0) {
      this.currentMonth = 11;
      this.currentYear--;
    } else {
      this.currentMonth--;
    }
    this.generateCalendar();
  }

  nextMonth() {
    if (this.currentMonth === 11) {
      this.currentMonth = 0;
      this.currentYear++;
    } else {
      this.currentMonth++;
    }
    this.generateCalendar();
  }
}