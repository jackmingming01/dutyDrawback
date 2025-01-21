"use client";
import React from "react";
import {Badge} from "@/components/ui/badge";
import {PencilIcon, XMarkIcon} from "@heroicons/react/24/solid";

import {FilterEntity} from "@/app/components/interfaces/filter";
import {Constants} from "@/app/config/constants";


interface FilterBadgeProps {
    filter: FilterEntity;
    startEditing: (filter: FilterEntity, index: number) => void;
    removeFilter: (index: number) => void;
    index: number;
    isEditing: boolean;
}

const FilterBadge: React.FC<FilterBadgeProps> = ({
                                                     filter,
                                                     startEditing,
                                                     removeFilter,
                                                     index,
                                                     isEditing
                                                 }) => {

    const convertSecondsToDate = (date: Date) => {
        // Extract the month, day, and year
        const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-indexed
        const day = String(date.getDate()).padStart(2, "0");
        const year = date.getFullYear();

        // Return the date in mm/dd/yyyy format
        return `${year}/${month}/${day}`;
    }

    const computeBadgeLabel = (filter: FilterEntity) => {
        let label = '';
        if (filter.inputType.type === Constants.types.DATE) {
            if (filter.inputType.key === Constants.keys["TAG__DATE_IS_IN"]) {
                if (filter.timeRange.start && filter.timeRange.end) {
                    label = filter.inputType.label + ' ' +
                        convertSecondsToDate(filter.timeRange.start) + ' - '
                        + convertSecondsToDate(filter.timeRange.end);
                }
            } else {
                label = filter.inputType.label;
            }
        } else if (filter.inputType.type === Constants.types.HTS) {
            label = filter.inputType.label + ' ' + filter.HTSCodes;
        }

        return label;
    };

    return <Badge
        variant={"secondary"}
        className={`flex items-center px-2 py-1 bg-gray-400 rounded-full mr-2  text-white hover:bg-gray-500 ${isEditing ? 'bg-yellow-300' : ''}`}
    >
        <span className={`min-w-16 max-w-44 ${isEditing ? 'text-gray-600' : ''}`} style={{"fontSize": ".7rem"}}>{computeBadgeLabel(filter)}</span>
        <button
            onClick={() => startEditing(filter, index)}
            className="ml-1 text-gray-600 hover:text-gray-800"
        >
            <PencilIcon className="h-4 w-4"/>
        </button>
        <button
            onClick={() => removeFilter(index)}
            className="ml-1 text-gray-600 hover:text-gray-800"
        >
            <XMarkIcon className="h-4 w-4"/>
        </button>
    </Badge>
}

export default FilterBadge