"use client";
import React, {useEffect, useState} from "react";
import {AlertCircle, Save} from "lucide-react"
import {Button} from "@/components/ui/button";
import {XMarkIcon, PlusIcon, MagnifyingGlassIcon} from "@heroicons/react/24/solid";
import {AdjustmentsVerticalIcon} from "@heroicons/react/24/outline";

import FilterBadge from "@/app/components/FilterBadge";
import FilterInputEntity from "@/app/components/FilterInputEntity";
import {
    Alert,
    AlertDescription,
    AlertTitle,
} from "@/components/ui/alert";
import {useTimeRangeValidator} from "@/app/hooks/useTimeRangeValidator";
import {useHTSValidator} from "@/app/hooks/useHTSValidator";
import {useDataHub} from "@/app/contexts/dataHubContexts";

import {searchEngineUtil} from "@/app/utils/utils";

import {Suggestion, FilterEntity, Claim} from "@/app/components/interfaces/filter";
import {Constants, suggestions} from "@/app/config/constants";

interface FilterProps {
    onHandleSetClaimData: (data: Claim[]) => void;
    claimData: Claim[];
}

interface SearchFields<T> {
    type: string,
    key: string,
    value: T[],
}

function computeSearchFields(filters: FilterEntity[]):object[] {
    const timeRange: SearchFields<object> = {
        type: "timeRange",
        key: "importDate",
        value: [],
    }
    const htsCode: SearchFields<string> = {
        type: "htsCode",
        key: "HTSCode",
        value: [],
    }

    filters.map((filter: FilterEntity) => {
        if (filter.type === Constants.types.DATE) {
            if (filter.inputType.key === Constants.keys["TAG__DATE_IS_IN"]) {

                timeRange.value.push({
                    type: "absolute",
                    start: filter.timeRange.start,
                    end: filter.timeRange.end
                })
            } else {
                timeRange.value.push({
                    type: "relative",
                    range: filter.inputType.key
                })
            }
        } else if(filter.type === Constants.types.HTS){
            htsCode.value.push(filter.HTSCodes)
        }
    });
    return [timeRange, htsCode]
};


const Filter: React.FC<FilterProps> = ({onHandleSetClaimData, claimData}) => {
    const {error: timeRangeError, addTimeRange, editTimeRange, resetTimeRanges} = useTimeRangeValidator();
    const {
        validateHTSCodes,
        resetValidation,
        editHTSCode,
        validateHTSCodeRealTime,
        errorMessage: HTSCodeError
    } = useHTSValidator();
    const {setData: setFilterDataContexts, data: filterDataContexts, getData: getFilterDataContexts} = useDataHub();


    const [isReady, setIsReady] = useState(false);
    const [reload, setReload] = useState(false);

    const [filters, setFilters] = useState<FilterEntity[]>([]);
    const [editingIndex, setEditingIndex] = useState<number | undefined>(undefined);
    const [editingValue, setEditingValue] = useState<FilterEntity | null>(null);

    const handleReload = () => {
        setReload(prev => !prev); // Toggle state to force re-render
    };
    const removeFilter = (index: number) => {
        setFilters((prevFilter) => prevFilter.filter((_, i) => i !== index));
    };

    const startEditing = (filter: FilterEntity, index: number) => {
        setEditingValue(filter);
        setEditingIndex(index);
        if (filter.inputType.type === Constants.types.HTS) {
            setFilterDataContexts(prev => {
                const copiedContexts = {...prev};
                copiedContexts.filterProps.inputType = filter.inputType;
                copiedContexts.filterProps.HTSCodes = filter.HTSCodes;
                return copiedContexts;
            });

            const filterContexts = getFilterDataContexts();
            filterContexts.setAutoCompleteInputValue(filter.inputType.label);
        } else {
            setFilterDataContexts(prev => {
                const copiedContexts = {...prev};
                copiedContexts.filterProps.inputType = filter.inputType;
                copiedContexts.filterProps.timeRange = filter.timeRange;
                return copiedContexts;
            });

            const filterContexts = getFilterDataContexts();
            filterContexts.setAutoCompleteInputValue(filter.inputType.label);
        }
        handleReload();
    };

    const handleReset = () => {
        setFilterDataContexts(prev => {
            const copiedContexts = {...prev};
            copiedContexts.filterProps.HTSCodes = "";
            copiedContexts.filterProps.inputType = {label: '', type: '', key: ''};
            copiedContexts.filterProps.timeRange = {end: null, start: null};

            return copiedContexts;
        });

        const filterContexts = getFilterDataContexts();
        filterContexts.setAutoCompleteInputValue('');
    };

    const handleClear = () => {
        setFilters([]);
        handleReset();
        resetValidation();
        resetTimeRanges();
        onHandleSetClaimData(filterDataContexts.originalClaims);

        handleReload();
    };

    const updateFilters = (absoluteTimeKey?: string) => {
        const copiedContexts = {...getFilterDataContexts()};
        const filter: FilterEntity = {
            type: copiedContexts.filterProps.inputType.type,
            inputType: copiedContexts.filterProps.inputType,
            HTSCodes: copiedContexts.filterProps.HTSCodes,
            timeRange: absoluteTimeKey ? {
                absoluteTimeKey,
                start: null,
                end: null
            } : copiedContexts.filterProps.timeRange
        };
        setFilters([...filters, filter])
        handleReset();
        filterDataContexts.resetAutoCompleteTexts();
    };

    const handleAddBadge = () => {
        const filterProps = filterDataContexts.filterProps;

        if (filterProps.inputType.type === Constants.types.DATE) {
            if (filterProps.inputType.key === Constants.keys["TAG__DATE_IS_IN"]) {
                if (filterProps.timeRange.start && filterProps.timeRange.end) {
                    addTimeRange(filterProps.timeRange.start, filterProps.timeRange.end, (error) => {
                        if (!error) {
                            updateFilters();
                        }
                    });
                }
            } else {
                updateFilters(filterProps.inputType.key);
            }
        } else if (filterProps.inputType.type === Constants.types.HTS) {
            validateHTSCodes(filterProps.HTSCodes, (_, error) => {
                if (!error) {
                    updateFilters();
                }
            });
        }
    };

    const saveUpdateFilter = (filters: FilterEntity[], index: number | undefined) => {
        const filtersContextsData = getFilterDataContexts();
        if (index !== undefined) {
            const copiedFilters = [...filters];
            const copiedFilter = {...copiedFilters[index]};

            if (filtersContextsData.filterProps.inputType.type === Constants.types.DATE) {
                const timeRange = filtersContextsData.filterProps.timeRange;

                editTimeRange(copiedFilter.timeRange, timeRange, (error) => {
                    if (!error) {
                        copiedFilters[index] = {
                            ...copiedFilter,
                            inputType: filtersContextsData.filterProps.inputType,
                            timeRange
                        }
                        setFilters(copiedFilters);
                        handleReset();
                        handleReload();
                        setEditingValue(null);
                        setEditingIndex(undefined);
                    }
                })
            } else {
                const HTSCodes = filtersContextsData.filterProps.HTSCodes;
                const oldHTSCodes = copiedFilters[index].HTSCodes;

                if (HTSCodes && HTSCodes !== '') {
                    editHTSCode(oldHTSCodes, HTSCodes, (error, _) => {
                        if (!error) {
                            copiedFilters[index] = {
                                ...copiedFilter,
                                inputType: filtersContextsData.filterProps.inputType,
                                HTSCodes
                            }
                            console.log('saveUpdateFilter copiedFilters: ', copiedFilters);
                            setFilters(copiedFilters);
                            handleReset();
                            handleReload();
                            setEditingValue(null);
                            setEditingIndex(undefined);
                        }
                    })
                }
            }
        }
    };

    const handleAddText = (selected: Suggestion) => {
        setFilterDataContexts(prev => {
            const copiedContexts = {...prev};
            copiedContexts.filterProps.inputType = selected;

            return copiedContexts;
        });
        handleReload();
    };

    const handleHTSCode = (HTSCodes: string) => {
        setTimeout(function () {
            validateHTSCodeRealTime(HTSCodes, (_, error) => {
                console.log('handleHTSCode error: ', error);
                if (!error) {
                    setFilterDataContexts(prev => {
                        const copiedContexts = {...prev};
                        copiedContexts.filterProps.HTSCodes = HTSCodes;

                        return copiedContexts;
                    });
                    handleReload();
                }
            });
        }, 1000)
    };

    const handleSearch = (filters) => {
        if (Array.isArray(filters) && filters.length) {
            const claims = [...filterDataContexts.originalClaims];
            console.log('handleSearch filterDataContexts: ', filterDataContexts);
            if (claims.length) {
                const {setClaims, setSearchFields, getResults} = searchEngineUtil();
                const searchFields = computeSearchFields(filters);
                setClaims(claims);
                setSearchFields(searchFields);
                const results = getResults();
                onHandleSetClaimData(results);
            }
        }
    };

    useEffect(() => {
        setFilterDataContexts(prev => ({
            ...prev,
            filterProps: {
                HTSCodes: "",
                timeRange: {end: null, start: null},
                inputType: {label: '', type: '', key: ''},
                handleAddText,
                suggestions,
                handleHTSCode
            }
        }));

        setIsReady(true);
    }, [setFilterDataContexts]);

    useEffect(() => {
        setFilterDataContexts(prev => ({
            ...prev,
            filters: filters
        }));
    }, [JSON.stringify(filters)]);

    // If not ready, show a loading indicator (or null)
    if (!isReady) {
        return <div className="flex flex-col w-full justify-center items-center">Initializing...</div>;
    }

    return (
        <div className="flex flex-col w-full">
            <div
                className="flex w-full border
                border-gray-300
                justify-between
                rounded-md px-3 py-2 items-center flex-wrap focus-within:border-blue-500 focus-within:ring focus-within:ring-blue-200 mb-2">
                {filters.length ?
                    <div className="flex w-full mb-3 pb-2 border-b border-b-gray-300">
                        {filters.map((filter, index) =>
                            (<FilterBadge
                                key={index}
                                index={index}
                                isEditing={editingIndex === undefined ? false : index === editingIndex}
                                filter={filter}
                                startEditing={startEditing} removeFilter={removeFilter}/>))}
                    </div> : null}
                <div className="flex items-center">
                    <div className="flex w-8 items-center">
                        <AdjustmentsVerticalIcon className="h-5 w-5 text-gray-400 mr-2"/>
                    </div>
                    <FilterInputEntity/>
                </div>
                <div className="flex justify-end items-center">
                    <Button
                        onClick={editingValue ? () => saveUpdateFilter(filters, editingIndex) : handleAddBadge}
                        className={`ml-2 flex items-center justify-center h-8 w-8 rounded-full 
                            bg-gray-400 text-white hover:bg-gray-500`}
                    >
                        {editingValue ? <Save className="h-4 w-4"/> : <PlusIcon className="h-4 w-4"/>}
                    </Button>
                </div>
            </div>
            <div
                className="flex w-full mb-5">
                {(timeRangeError || HTSCodeError) && <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4"/>
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>
                        {timeRangeError || HTSCodeError}
                    </AlertDescription>
                </Alert>}
            </div>
            <div
                className="flex w-full">
                <div className="flex space-x-4 justify-end w-full">
                    {/* Reset Button */}
                    <Button
                        variant='destructive'
                        className="flex items-center space-x-1"
                        onClick={handleClear}
                    >
                        <XMarkIcon className="h-5 w-5"/>
                        <span style={{"marginLeft": 0}}>Reset</span>
                    </Button>

                    {/* Search Button */}
                    <Button
                        variant="outline"
                        className="flex items-center space-x-1"
                        onClick={() => handleSearch(filters)}
                    >
                        <MagnifyingGlassIcon className="h-5 w-5"/>
                        <span style={{"marginLeft": 0}}>Search</span>
                    </Button>
                </div>
            </div>
        </div>
    )
}

export default Filter;