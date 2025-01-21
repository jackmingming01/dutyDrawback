"use client";

import React, {useState, useEffect} from "react";
import {Input} from "@/app/components/Input";

import {useDataHub} from "@/app/contexts/dataHubContexts";
import {useHTSValidator} from "@/app/hooks/useHTSValidator";

interface HTSInputProps {
    getHTSCode: (HTSCodes: string) => void;
}

const HTSInput: React.FC<HTSInputProps> = ({getHTSCode}: HTSInputProps) => {
    const {setData: setFilterHTSCodeFunction} = useDataHub();
    const {autoFormatHTSCodes} = useHTSValidator();
    const [inputValue, setInputValue] = useState<string>("");


    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value;
        console.log('rawValue: ', rawValue);
        const formattedValue = autoFormatHTSCodes(rawValue);
        setInputValue(formattedValue);
    };

    useEffect(() => {
        getHTSCode(inputValue);
    }, [inputValue]);

    useEffect(() => {
        setFilterHTSCodeFunction(prev => ({
            ...prev,
            setHTSCode: setInputValue
        }));
    }, []);

    return (
        <div className="relative w-full max-w-lg min-w-96">
            <Input
                value={inputValue}
                onChange={handleChange}
                placeholder="Enter codes (e.g.,*.12.34.56 1234.12.4%d.1%d, 5678.34.20.34)"
                className="w-full bg-transparent"
            />
        </div>
    );
};

export default HTSInput;
