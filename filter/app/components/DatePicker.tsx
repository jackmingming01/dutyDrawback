import React, {useEffect, useState} from "react";
import {format} from "date-fns";
import {CalendarIcon} from "lucide-react";

import {useDataHub} from "@/app/contexts/dataHubContexts";

import {cn} from "@/lib/utils";
import {Button} from "@/components/ui/button";
import {Calendar} from "@/components/ui/calendar";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";

interface DatePickerProps {
    type: string;
}

const DatePicker = ({type}: DatePickerProps) => {
    const {setData: setDatePickerData} = useDataHub();
    const [date, setDate] = useState<Date | null>(null);

    const handleDateChange = (selectedDate: Date | undefined) => {
        if (selectedDate) {
            setDate(selectedDate);
            setDatePickerData((prev) => {
                const copiedContexts = {...prev};
                const copiedCurrentTimeRange = {...copiedContexts.filterProps.timeRange};
                copiedCurrentTimeRange[type] = selectedDate;
                copiedContexts.filterProps.timeRange = copiedCurrentTimeRange;
                return copiedContexts;
            });
        }
    };

    useEffect(() => {
        setDatePickerData((prev) => ({...prev, ['set' + type + 'Date']: setDate}));
    }, []);

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant={"outline"}
                    className={cn(
                        "w-[240px] justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                    )}
                >
                    <CalendarIcon/>
                    {date ? format(date, "PPP") : <span>Pick a {type} date</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="single"
                    selected={date}
                    onSelect={handleDateChange} // Use the new handler
                    initialFocus
                />
            </PopoverContent>
        </Popover>
    );
}

export default DatePicker;
