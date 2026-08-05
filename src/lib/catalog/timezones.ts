/** Common timezones for birth form select (India-first list + globals). */
export const TIMEZONE_OPTIONS = [
  { value: "Asia/Kolkata", label: "India (Asia/Kolkata)" },
  { value: "Asia/Dubai", label: "UAE (Asia/Dubai)" },
  { value: "Asia/Singapore", label: "Singapore (Asia/Singapore)" },
  { value: "Asia/Tokyo", label: "Japan (Asia/Tokyo)" },
  { value: "Asia/Shanghai", label: "China (Asia/Shanghai)" },
  { value: "Asia/Hong_Kong", label: "Hong Kong" },
  { value: "Europe/London", label: "UK (Europe/London)" },
  { value: "Europe/Paris", label: "Central Europe (Europe/Paris)" },
  { value: "America/New_York", label: "US Eastern (America/New_York)" },
  { value: "America/Chicago", label: "US Central (America/Chicago)" },
  { value: "America/Denver", label: "US Mountain (America/Denver)" },
  { value: "America/Los_Angeles", label: "US Pacific (America/Los_Angeles)" },
  { value: "Australia/Sydney", label: "Australia Sydney" },
  { value: "UTC", label: "UTC" },
] as const;
