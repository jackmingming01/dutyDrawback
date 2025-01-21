export interface Suggestion {
    label: string;
    key: string;
    type: string;
}

// export interface TimeRange {
//     [key: string]: {
//         timestamp: number;
//     }
// }

export interface TimeRange {
    start: Date | null;
    end: Date | null;
    absoluteTimeKey?: string;
}

export interface FilterEntity {
    type?:string;
    inputType: Suggestion;
    HTSCodes: string;
    timeRange: TimeRange;
}

export interface Claim {
    claimID: number;
    importerName: string;
    HTSCode: string;
    importDate: string;
    importQuantity: number;
    exportDate: string;
    exportQuantity: number;
    dutiesPaid: number;
    drawbackClaimed: number;
    drawbackType: string;
}