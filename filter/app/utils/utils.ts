interface RelativeTimeRange {
  type: "relative";
  range:
    | "twoWeeksBeforeToNow"
    | "oneWeekBeforeToNow"
    | "last30DaysToNow"
    | "last60DaysToNow"
    | "last90DaysToNow"
    | "last1CalendarMonth"
    | "last2CalendarMonths"
    | "last3CalendarMonths";
}

interface AbsoluteTimeRange {
  type: "absolute";
  start: Date;
  end: Date;
}

type TimeRange = RelativeTimeRange | AbsoluteTimeRange;

interface SearchField<T> {
  type: "timeRange" | "htsCode" | "exact";
  key?: string;
  value: T | T[] | TimeRange[]; // Allow empty arrays
}

interface Record {
  [key: string]: any;
}

function calculateRelativeRange(range: RelativeTimeRange): { start: Date; end: Date } {
  const now = new Date();
  switch (range.range) {
    case "twoWeeksBeforeToNow":
      return { start: new Date(now.getTime() - 14 * 86400000), end: now };
    case "oneWeekBeforeToNow":
      return { start: new Date(now.getTime() - 7 * 86400000), end: now };
    case "last30DaysToNow":
      return { start: new Date(now.getTime() - 30 * 86400000), end: now };
    case "last60DaysToNow":
      return { start: new Date(now.getTime() - 60 * 86400000), end: now };
    case "last90DaysToNow":
      return { start: new Date(now.getTime() - 90 * 86400000), end: now };
    case "last1CalendarMonth": {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      return { start, end };
    }
    case "last2CalendarMonths": {
      const start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      return { start, end };
    }
    case "last3CalendarMonths": {
      const start = new Date(now.getFullYear(), now.getMonth() - 3, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      return { start, end };
    }
    default:
      return { start: new Date(0), end: now };
  }
}

function buildRegexFromPattern(pattern: string): RegExp {
  const regexPattern = pattern
    // Escape special characters but keep * for wildcard
    .replace(/[-\/\\^$+?.()|[\]{}]/g, "\\$&")
    // Handle ranges
    .replace(/{(\d+)-(\d+)}/g, (_, start, end) => `[${start}-${end}]`)
    // Replace %d with exactly one digit
    .replace(/%d/g, "\\d")
    // Replace * with one or more digits
    .replace(/\*/g, "\\d+");

  // Split the pattern into sections assuming they are separated by dots
  const sections = regexPattern.split("\\.");
  if (sections.length !== 4) {
    throw new Error(`Invalid HTS pattern "${pattern}". Must have exactly 4 sections (xxxx.xx.xx.xx).`);
  }

  // Ensure each section has at least one character
  const finalPattern = sections.map((section, index) => {
    // First section should be exactly 4 digits
    if (index === 0) {
      return `(${section.length > 0 ? section : "\\d{4}"})`;
    }
    // Other sections can be 2 digits or more if wildcard is used
    return `(${section.length > 0 ? section : "\\d{2}"})`;
  }).join("\\.");

  return new RegExp(`^${finalPattern}$`);
}

function matchHTSCode(htsCode: string, patterns: string | string[] | undefined): boolean {
  if (!patterns || (Array.isArray(patterns) && patterns.length === 0)) return true; // Match all if no patterns provided
  const patternArray = Array.isArray(patterns) ? patterns : patterns.split(",").map((p) => p.trim());
  return patternArray.some((pattern) => {
    const regex = buildRegexFromPattern(pattern);
    return regex.test(htsCode);
  });
}

function matchTimeRange(dateString: string, timeRanges: TimeRange[] | undefined): boolean {
  if (!timeRanges || timeRanges.length === 0) return true; // Match all if no time ranges provided
  const currentDate = new Date(dateString);
  if (isNaN(currentDate.getTime())) return false;

  return timeRanges.some((range) => {
    let start: Date, end: Date;
    if (range.type === "absolute") {
      start = range.start;
      end = range.end;
    } else {
      ({ start, end } = calculateRelativeRange(range));
    }
    return currentDate >= start && currentDate <= end;
  });
}

function searchEngineUtil() {
  let data: Record[] = [];
  let searchFields: SearchField<any>[] = [];

  function setClaims(newData: Record[]) {
    data = newData;
  }

  function setSearchFields(newSearchFields: SearchField<any>[]) {
    searchFields = newSearchFields;
  }

  function getResults(): Record[] {
    return data.filter((item) =>
      searchFields.every((field) => {
        if (field.type === "timeRange" && field.key && field.value !== undefined) {
          return matchTimeRange(item[field.key], field.value as TimeRange[]);
        } else if (field.type === "htsCode" && field.key && field.value !== undefined) {
          return matchHTSCode(item[field.key], field.value as string | string[]);
        } else if (field.type === "exact" && field.key && field.value !== undefined) {
          return item[field.key] === field.value;
        }
        return true;
      })
    );
  }

  return {
    setClaims,
    setSearchFields,
    getResults,
  };
}

export { searchEngineUtil };