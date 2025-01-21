import {Suggestion} from "@/app/components/interfaces/filter";

export const Constants: { [key: string]: any } = {
    keys: {
        "TAG__HTS_IS_ANY": 'TAG__HTS_IS_ANY',
        "TAG__DATE_IS_IN": 'TAG__DATE_IS_IN',
        "twoWeeksBeforeToNow": 'twoWeeksBeforeToNow',
        "oneWeekBeforeToNow": 'oneWeekBeforeToNow',
        "last30DaysToNow": 'last30DaysToNow',
        "last60DaysToNow": 'last60DaysToNow',
        "last90DaysToNow": 'last90DaysToNow',
        "last1CalendarMonth": 'last1CalendarMonth',
        "last2CalendarMonths": 'last2CalendarMonths',
        "last3CalendarMonths": 'last3CalendarMonths',
    },
    labels: {
        "TAG__HTS_IS_ANY": "HTS is any",
        "TAG__DATE_IS_IN": "Date is in",
        "twoWeeksBeforeToNow": "Date is one week to now",
        "oneWeekBeforeToNow": "Date is two week to now",
        "last30DaysToNow": "Date is last 30 days to now",
        "last60DaysToNow": "Date is last 60 days to now",
        "last90DaysToNow": "Date is last 90 days to now",
        "last1CalendarMonth": "Date is last calendar month",
        "last2CalendarMonths": "Date is last 2 calendar months",
        "last3CalendarMonths": '"Date is last 3 calendar months"',
    },
    types: {
        HTS: "HTS",
        DATE: "DATE"
    },
    mode:{
        editing: 'EDITING'
    }
}

export const suggestions: Suggestion[] = [
    {label: Constants.labels["TAG__HTS_IS_ANY"], key: Constants.keys["TAG__HTS_IS_ANY"], type: Constants.types.HTS},
    {label: Constants.labels["TAG__DATE_IS_IN"], key: Constants.keys["TAG__DATE_IS_IN"], type: Constants.types.DATE},
    {label: Constants.labels.twoWeeksBeforeToNow, key: Constants.keys.twoWeeksBeforeToNow, type: Constants.types.DATE},
    {label: Constants.labels.oneWeekBeforeToNow, key: Constants.keys.oneWeekBeforeToNow, type: Constants.types.DATE},
    {label: Constants.labels.last30DaysToNow, key: Constants.keys.last30DaysToNow, type: Constants.types.DATE},
    {label: Constants.labels.last60DaysToNow, key: Constants.keys.last60DaysToNow, type: Constants.types.DATE},
    {label: Constants.labels.last90DaysToNow, key: Constants.keys.last90DaysToNow, type: Constants.types.DATE},
    {label: Constants.labels.last1CalendarMonth, key: Constants.keys.last1CalendarMonth, type: Constants.types.DATE},
    {label: Constants.labels.last2CalendarMonths, key: Constants.keys.last2CalendarMonths, type: Constants.types.DATE},
    {label: Constants.labels.last3CalendarMonths, key: Constants.keys.last3CalendarMonths, type: Constants.types.DATE}
]