"use client";
import {useState, useMemo, useCallback} from "react";

/** ──────────────────────────────────────────────────────────────
 *  1) Parsing & Regex for EXACT 4-Section HTS Code
 *     Each token:
 *       - {x-y} => one digit in [x..y]
 *       - %d => one digit [0-9]
 *       - *  => \d+ (one or more digits)
 *  ────────────────────────────────────────────────────────────── */
function parseSection(section: string, position: number): string {
    // Escape most regex chars, but not curly braces for range or asterisk for wildcard:
    let subRegex = section.replace(/[-\/\\^$+?.()|[\]]/g, "\\$&");

    // {x-y} or x-y => [x-y]
    subRegex = subRegex.replace(/(\{(\d+)-(\d+)\}|(\d+)-(\d+))/g, (_, match, start1, end1, start2, end2) => {
        const start = start1 || start2;
        const end = end1 || end2;

        return `[${start}-${end}]`;
    });

    // %d => \d
    subRegex = subRegex.replace(/%d/g, "\\d");

    // * => \d{4} or \d{2} based on position
    if (position === 0) {
        subRegex = subRegex.replace(/\*/g, "\\d{4}");
    } else {
        subRegex = subRegex.replace(/\*/g, "\\d{2}");
    }

    return subRegex;
}

function buildRegexFromPattern(pattern: string): RegExp {
    // Must have exactly 4 sections separated by '.'
    const sections = pattern.split(".");
    if (sections.length !== 4) {
        throw new Error(
            `Invalid HTS pattern "${pattern}". Must have exactly 4 sections (xxxx.xx.xx.xx).`
        );
    }

    const [s1, s2, s3, s4] = sections.map((section, index) => parseSection(section, index));

    // Join with literal dots and anchor with ^$
    const final = `^${s1}\\.${s2}\\.${s3}\\.${s4}$`;
    return new RegExp(final);
}


/** ──────────────────────────────────────────────────────────────
 *  2) Time Range Types (Relative & Absolute)
 *  ────────────────────────────────────────────────────────────── */
interface RelativeTimeRange {
    type: "relative";
    range:
        | "oneWeekBeforeToNow"
        | "twoWeeksBeforeToNow"
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

/** ──────────────────────────────────────────────────────────────
 *  3) SearchField type => timeRange, htsCode, exact
 *  ────────────────────────────────────────────────────────────── */
export interface SearchField {
    type: "timeRange" | "htsCode" | "exact";
    key?: string;
    value: any;
}

interface RecordData {
    [key: string]: any;
}

/** ──────────────────────────────────────────────────────────────
 *  4) Optional: date parsing & relative time logic
 *  ────────────────────────────────────────────────────────────── */
function parseYYYYMMDD(dateString: string): Date | null {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return null;

    const [yy, mm, dd] = dateString.split("-");
    const y = parseInt(yy, 10);
    const m = parseInt(mm, 10);
    const d = parseInt(dd, 10);

    const date = new Date(y, m - 1, d);
    if (date.getFullYear() !== y || date.getMonth() + 1 !== m || date.getDate() !== d) {
        return null;
    }
    return date;
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
      // Entire previous calendar month
      // Start: First day of previous month at 00:00:00
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      // End: Last day of previous month at 23:59:59.999
      const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      return { start, end };
    }

    case "last2CalendarMonths": {
      // Entire previous 2 calendar months
      const start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      return { start, end };
    }

    case "last3CalendarMonths": {
      // Entire previous 3 calendar months
      const start = new Date(now.getFullYear(), now.getMonth() - 3, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      return { start, end };
    }

    default:
      // Fallback if unknown range
      return { start: new Date(0), end: now };
  }
}

/** ──────────────────────────────────────────────────────────────
 *  5) The Hook => useSearchEngine
 *  ────────────────────────────────────────────────────────────── */
export function useSearchEngine(data: RecordData[], searchFields: SearchField[]) {
    const [results, setResults] = useState<RecordData[]>([]);

    // A) Match HTS code with the buildRegexFromPattern logic
    const matchHTSCode = useCallback((hts: string, patterns: string | string[]) => {
        console.log('patterns: ', patterns);
        const arr = Array.isArray(patterns) ? patterns : patterns.split(",").map(p => p.trim());

        return arr.some((p) => {
            try {
                const regex = buildRegexFromPattern(p);
                return regex.test(hts);
            } catch (err) {
                console.warn("Invalid HTS pattern:", p, err);
                return false;
            }
        });
    }, []);

    // B) Match time range => parse date & compare to (absolute or relative) range
    const matchTimeRange = useCallback((dateString: string, timeRanges: TimeRange[]) => {
        const dt = parseYYYYMMDD(dateString);
        if (!dt) return false;

        return timeRanges.some((r) => {
            if (r.type === "absolute") {
                return dt >= r.start && dt <= r.end;
            } else {
                const {start, end} = calculateRelativeRange(r);
                return dt >= start && dt <= end;
            }
        });
    }, []);

    // C) The filtering logic
    const filteredResults = useMemo(() => {
        return data.filter((item) =>
            searchFields.every((field) => {
                if (!field.key || !field.value) return true;

                if (field.type === "timeRange") {
                    return matchTimeRange(item[field.key], field.value);
                } else if (field.type === "htsCode") {
                    return matchHTSCode(item[field.key], field.value);
                } else if (field.type === "exact") {
                    return item[field.key] === field.value;
                }
                return true;
            })
        );
    }, [data, searchFields, matchHTSCode, matchTimeRange]);

    // D) Store results in state
    useMemo(() => setResults(filteredResults), [filteredResults]);

    return {results};
}