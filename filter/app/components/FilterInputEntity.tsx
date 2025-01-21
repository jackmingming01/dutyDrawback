"use client";
import React from "react";
import AutoComplete from "@/app/components/AutoComplete";
import HTSInput from "@/app/components/HTSInput";
import DatePicker from "@/app/components/DatePicker";

import {useDataHub} from "@/app/contexts/dataHubContexts";

import {Constants} from "@/app/config/constants";


const FilterInputEntity = () => {
    const {data: filterDataContexts} = useDataHub();


    return <>
        <AutoComplete onAddText={filterDataContexts.filterProps.handleAddText}
                      suggestions={filterDataContexts.filterProps.suggestions}/>
        <div className="flex items-center">
            {filterDataContexts.filterProps.inputType.type === 'HTS' &&
                <HTSInput getHTSCode={filterDataContexts.filterProps.handleHTSCode}/>}
            {(filterDataContexts.filterProps.inputType.type === 'DATE' && filterDataContexts.filterProps.inputType.key === Constants.keys["TAG__DATE_IS_IN"]) &&
                <div className="flex justify-center items-center">
                    <DatePicker type={'start'}/>
                    <div className="flex justify-center">&nbsp;to&nbsp;</div>
                    <DatePicker type={'end'}/>
                </div>}
        </div>
    </>
}

export default FilterInputEntity;