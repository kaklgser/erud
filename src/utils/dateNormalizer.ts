export interface ParsedDate {
  year: number;
  month: number | null;
  isFuture: boolean;
  isExpected: boolean;
  isPresent: boolean;
  originalString: string;
  normalized: string;
  isValid: boolean;
  warning?: string;
}

export class DateNormalizer {
  private static readonly MONTH_NAMES: { [key: string]: number } = {
    'jan': 1, 'january': 1,
    'feb': 2, 'february': 2,
    'mar': 3, 'march': 3,
    'apr': 4, 'april': 4,
    'may': 5,
    'jun': 6, 'june': 6,
    'jul': 7, 'july': 7,
    'aug': 8, 'august': 8,
    'sep': 9, 'sept': 9, 'september': 9,
    'oct': 10, 'october': 10,
    'nov': 11, 'november': 11,
    'dec': 12, 'december': 12
  };

  private static readonly EXPECTED_KEYWORDS = [
    'expected',
    'incoming',
    'anticipated',
    'graduating',
    'completion',
    'prospective'
  ];

  private static readonly PRESENT_KEYWORDS = [
    'present',
    'current',
    'now',
    'ongoing',
    'till date',
    'to date'
  ];

  static parseDateFlexible(dateString: string): ParsedDate {
    if (!dateString || typeof dateString !== 'string') {
      return this.createInvalidDate(dateString, 'Empty or invalid date string');
    }

    const cleaned = dateString.trim().toLowerCase();
    const originalString = dateString.trim();

    const isExpected = this.EXPECTED_KEYWORDS.some(keyword => cleaned.includes(keyword));
    const isPresent = this.PRESENT_KEYWORDS.some(keyword => cleaned.includes(keyword));

    if (isPresent) {
      const currentDate = new Date();
      return {
        year: currentDate.getFullYear(),
        month: currentDate.getMonth() + 1,
        isFuture: false,
        isExpected: false,
        isPresent: true,
        originalString,
        normalized: 'Present',
        isValid: true
      };
    }

    const cleanedForParsing = cleaned
      .replace(/expected|incoming|anticipated|graduating|completion|prospective/gi, '')
      .trim();

    let year: number | null = null;
    let month: number | null = null;

    const yearMatch = cleanedForParsing.match(/\b(19|20)\d{2}\b/);
    if (yearMatch) {
      year = parseInt(yearMatch[0], 10);
    }

    for (const [monthName, monthNum] of Object.entries(this.MONTH_NAMES)) {
      if (cleanedForParsing.includes(monthName)) {
        month = monthNum;
        break;
      }
    }

    const monthYearMatch = cleanedForParsing.match(/(\d{1,2})[\/\-.](\d{4})/);
    if (monthYearMatch) {
      const potentialMonth = parseInt(monthYearMatch[1], 10);
      const potentialYear = parseInt(monthYearMatch[2], 10);
      if (potentialMonth >= 1 && potentialMonth <= 12) {
        month = potentialMonth;
        year = potentialYear;
      }
    }

    const yearMonthMatch = cleanedForParsing.match(/(\d{4})[\/\-.](\d{1,2})/);
    if (yearMonthMatch) {
      const potentialYear = parseInt(yearMonthMatch[1], 10);
      const potentialMonth = parseInt(yearMonthMatch[2], 10);
      if (potentialMonth >= 1 && potentialMonth <= 12) {
        year = potentialYear;
        month = potentialMonth;
      }
    }

    if (!year) {
      return this.createInvalidDate(originalString, 'Could not parse year from date string');
    }

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const isFuture = year > currentYear || (year === currentYear && month && month > currentMonth) || isExpected;

    const normalized = month
      ? `${String(month).padStart(2, '0')}/${year}`
      : `${year}`;

    let warning: string | undefined;
    if (isFuture && !isExpected) {
      warning = `Future date detected without 'expected' keyword. Date: ${normalized}`;
    }

    return {
      year,
      month,
      isFuture,
      isExpected,
      isPresent: false,
      originalString,
      normalized,
      isValid: true,
      warning
    };
  }

  private static createInvalidDate(originalString: string, warning: string): ParsedDate {
    return {
      year: 0,
      month: null,
      isFuture: false,
      isExpected: false,
      isPresent: false,
      originalString: originalString || '',
      normalized: 'Invalid Date',
      isValid: false,
      warning
    };
  }

  static calculateDuration(startDate: string, endDate: string): {
    years: number;
    months: number;
    totalMonths: number;
    isValid: boolean;
    warning?: string;
  } {
    const start = this.parseDateFlexible(startDate);
    const end = this.parseDateFlexible(endDate);

    if (!start.isValid || !end.isValid) {
      return {
        years: 0,
        months: 0,
        totalMonths: 0,
        isValid: false,
        warning: 'One or both dates are invalid'
      };
    }

    const startYear = start.year;
    const startMonth = start.month || 1;
    const endYear = end.isPresent ? new Date().getFullYear() : end.year;
    const endMonth = end.isPresent ? new Date().getMonth() + 1 : (end.month || 12);

    const totalMonths = (endYear - startYear) * 12 + (endMonth - startMonth);

    if (totalMonths < 0) {
      return {
        years: 0,
        months: 0,
        totalMonths: 0,
        isValid: false,
        warning: 'End date is before start date'
      };
    }

    const years = Math.floor(totalMonths / 12);
    const months = totalMonths % 12;

    return {
      years,
      months,
      totalMonths,
      isValid: true
    };
  }

  static formatDateForDisplay(parsedDate: ParsedDate): string {
    if (!parsedDate.isValid) {
      return parsedDate.originalString;
    }

    if (parsedDate.isPresent) {
      return 'Present';
    }

    if (parsedDate.isExpected) {
      const base = parsedDate.month
        ? `${this.getMonthName(parsedDate.month)} ${parsedDate.year}`
        : `${parsedDate.year}`;
      return `Expected ${base}`;
    }

    if (parsedDate.month) {
      return `${this.getMonthName(parsedDate.month)} ${parsedDate.year}`;
    }

    return `${parsedDate.year}`;
  }

  private static getMonthName(monthNum: number): string {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return monthNames[monthNum - 1] || 'Unknown';
  }

  static validateDateRange(startDate: string, endDate: string): {
    isValid: boolean;
    warnings: string[];
    normalizedStart: string;
    normalizedEnd: string;
  } {
    const start = this.parseDateFlexible(startDate);
    const end = this.parseDateFlexible(endDate);
    const warnings: string[] = [];

    if (!start.isValid) {
      warnings.push(`Invalid start date: ${startDate}`);
    }

    if (!end.isValid) {
      warnings.push(`Invalid end date: ${endDate}`);
    }

    if (start.isValid && start.warning) {
      warnings.push(start.warning);
    }

    if (end.isValid && end.warning) {
      warnings.push(end.warning);
    }

    const duration = this.calculateDuration(startDate, endDate);
    if (!duration.isValid && duration.warning) {
      warnings.push(duration.warning);
    }

    return {
      isValid: start.isValid && end.isValid && duration.isValid,
      warnings,
      normalizedStart: start.normalized,
      normalizedEnd: end.normalized
    };
  }

  static normalizeAllDates(dates: string[]): ParsedDate[] {
    return dates.map(date => this.parseDateFlexible(date));
  }

  static shouldPenalizeFutureDate(parsedDate: ParsedDate): boolean {
    return parsedDate.isFuture && !parsedDate.isExpected;
  }
}

export const dateNormalizer = DateNormalizer;
