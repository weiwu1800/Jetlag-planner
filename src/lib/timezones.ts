export interface TimezoneOption {
  label: string;
  value: string;
}

/**
 * A curated list of commonly traveled-to IANA timezones. Not exhaustive, but
 * searchable via SelectField and covers the regions most trips touch.
 */
export const TIMEZONE_OPTIONS: TimezoneOption[] = [
  { label: 'Honolulu (HT)', value: 'Pacific/Honolulu' },
  { label: 'Anchorage (AKT)', value: 'America/Anchorage' },
  { label: 'Los Angeles (PT)', value: 'America/Los_Angeles' },
  { label: 'Denver (MT)', value: 'America/Denver' },
  { label: 'Chicago (CT)', value: 'America/Chicago' },
  { label: 'New York (ET)', value: 'America/New_York' },
  { label: 'Toronto', value: 'America/Toronto' },
  { label: 'Mexico City', value: 'America/Mexico_City' },
  { label: 'Sao Paulo', value: 'America/Sao_Paulo' },
  { label: 'Buenos Aires', value: 'America/Argentina/Buenos_Aires' },
  { label: 'London (GMT/BST)', value: 'Europe/London' },
  { label: 'Lisbon', value: 'Europe/Lisbon' },
  { label: 'Paris', value: 'Europe/Paris' },
  { label: 'Berlin', value: 'Europe/Berlin' },
  { label: 'Madrid', value: 'Europe/Madrid' },
  { label: 'Rome', value: 'Europe/Rome' },
  { label: 'Athens', value: 'Europe/Athens' },
  { label: 'Istanbul', value: 'Europe/Istanbul' },
  { label: 'Moscow', value: 'Europe/Moscow' },
  { label: 'Cairo', value: 'Africa/Cairo' },
  { label: 'Johannesburg', value: 'Africa/Johannesburg' },
  { label: 'Nairobi', value: 'Africa/Nairobi' },
  { label: 'Dubai', value: 'Asia/Dubai' },
  { label: 'Karachi', value: 'Asia/Karachi' },
  { label: 'Mumbai / Delhi', value: 'Asia/Kolkata' },
  { label: 'Dhaka', value: 'Asia/Dhaka' },
  { label: 'Bangkok', value: 'Asia/Bangkok' },
  { label: 'Jakarta', value: 'Asia/Jakarta' },
  { label: 'Singapore', value: 'Asia/Singapore' },
  { label: 'Hong Kong', value: 'Asia/Hong_Kong' },
  { label: 'Shanghai / Beijing', value: 'Asia/Shanghai' },
  { label: 'Tokyo', value: 'Asia/Tokyo' },
  { label: 'Seoul', value: 'Asia/Seoul' },
  { label: 'Sydney', value: 'Australia/Sydney' },
  { label: 'Perth', value: 'Australia/Perth' },
  { label: 'Auckland', value: 'Pacific/Auckland' },
  { label: 'UTC', value: 'UTC' },
];
