import { Component, OnInit,NgZone, ChangeDetectorRef } from '@angular/core';
import { ipcRenderer } from 'electron';
import { AppService } from '../../core/services/app.service';

@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss']
})
export class CalendarComponent implements OnInit {


  dateFurnaceMap: {
  [date: string]: { [furnaceName: string]: number }
} = {};


  dateCountMap: { [date: string]: number } = {};

  weekDays = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  months = [
    'Jan','Feb','Mar','Apr','May','June',
    'July','Aug','Sep','Oct','Novr','Dec'
  ];

  calendarDays: any[] = [];
  allLogs: any[] = [];

  selectedDayLogs: any[] = [];
showPopup = false;

showMonthPicker = false;
pickerYear!: number;



  currentMonth!: number;
  currentYear!: number;

  constructor(private zone: NgZone, 
    private cdr: ChangeDetectorRef,
   private app: AppService) {}


  ngOnInit() {
    const today = new Date();
    this.currentMonth = today.getMonth();
    this.currentYear = today.getFullYear();

      this.pickerYear = this.currentYear;
    this.generateCalendar();
    this.loadCalendarData();
  }

generateCalendar() {
  const firstDay = new Date(this.currentYear, this.currentMonth, 1).getDay();
  const totalDays = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();

  this.calendarDays = [];

  for (let i = 0; i < firstDay; i++) {
    this.calendarDays.push({ currentMonth: false });
  }

  for (let d = 1; d <= totalDays; d++) {
    const dateObj = new Date(this.currentYear, this.currentMonth, d);
const dateKey =
  dateObj.getFullYear() + '-' +
  String(dateObj.getMonth() + 1).padStart(2, '0') + '-' +
  String(dateObj.getDate()).padStart(2, '0');

    const today = new Date();

    if (this.dateCountMap[dateKey]) {
  console.log(
    'CALENDAR MATCH:',
    dateKey,
    'COUNT:',
    this.dateCountMap[dateKey]
  );
}


this.calendarDays.push({
  date: d,
  dateKey,
  currentMonth: true,
  count: this.dateCountMap[dateKey] || 0,
  furnaceSummary: this.dateFurnaceMap[dateKey] || {},
  hasData: !!this.dateCountMap[dateKey],
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
  this.loadCalendarData(); 
}

nextMonth() {
  if (this.currentMonth === 11) {
    this.currentMonth = 0;
    this.currentYear++;
  } else {
    this.currentMonth++;
  }

  this.generateCalendar();
  this.loadCalendarData(); 
}



  getMonthRange(year: number, month: number) {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);

  const format = (d: Date) => d.toISOString().split('T')[0];

  return {
    start: format(start),
    end: format(end)
  };
}




loadCalendarData() {
  const { start, end } = this.getMonthRange(
    this.currentYear,
    this.currentMonth
  );

  const ip = this.app.getSelectedIP();
  console.log('Selected IP for Calendar:', ip);

  const baseUrl = this.sanitizeBaseUrl(ip);

  ipcRenderer
    .invoke('get-spectrum-logs', {
      baseUrl,
      start,
      end
    })
    .then(res => {

      this.zone.run(() => {

        if (!res || !res.success) {
          console.error('❌ API Error:', res?.error);
          return;
        }

        this.dateCountMap = {};
        this.dateFurnaceMap = {};
        this.allLogs = [];

        const logs = res.data?.data || [];
        console.log('RETRIEVED LOGS:', logs);

        this.allLogs = logs;

        logs.forEach(item => {

          const d = new Date(item.createdAt);
          const dateKey =
            d.getFullYear() + '-' +
            String(d.getMonth() + 1).padStart(2, '0') + '-' +
            String(d.getDate()).padStart(2, '0');

          this.dateCountMap[dateKey] =
            (this.dateCountMap[dateKey] || 0) + 1;

          const furnaceName = item.furnace?.name || 'Unknown Furnace';

          if (!this.dateFurnaceMap[dateKey]) {
            this.dateFurnaceMap[dateKey] = {};
          }

          this.dateFurnaceMap[dateKey][furnaceName] =
            (this.dateFurnaceMap[dateKey][furnaceName] || 0) + 1;
        });


        this.generateCalendar();

        this.cdr.detectChanges();
      });
    })
    .catch(err => {
      console.error('Error:', err);
    });
}



sanitizeBaseUrl(ip: string): string {
  if (!ip) return '';

  return ip
    .replace(/^http?:\/\//, '') 
    .replace(/\/$/, '');         
}



openDayPopup(dateKey: string) {
  this.selectedDayLogs = this.allLogs.filter(log =>
    log.createdAt.startsWith(dateKey)
  );

  console.log('POPUP LOGS:', this.selectedDayLogs);

  this.showPopup = true;
}

closePopup() {
  this.showPopup = false;
}


toggleMonthPicker() {
  this.showMonthPicker = !this.showMonthPicker;
}

changeYear(step: number) {
  this.pickerYear += step;
}

selectMonth(monthIndex: number) {
  this.currentMonth = monthIndex;
  this.currentYear = this.pickerYear;

  this.showMonthPicker = false;

  this.generateCalendar();
  this.loadCalendarData();
}



}