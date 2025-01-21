"use client";

import React, {useState, useRef, useEffect} from "react";
import {Input} from "@/app/components/Input";
import {Suggestion} from "@/app/components/interfaces/filter";

import {useDataHub} from "@/app/contexts/dataHubContexts";
import FilterInputEntity from "@/app/components/FilterInputEntity";


interface AutoCompleteProps {
    onAddText: (selected: Suggestion) => void; // Update type for returning the object
    suggestions: Suggestion[];
}

const AutoComplete: React.FC<AutoCompleteProps> = ({
                                                       onAddText,
                                                       suggestions,
                                                   }) => {
    const {data, setData} = useDataHub();
    const [inputValue, setInputValue] = useState("");
    const [filteredSuggestions, setFilteredSuggestions] = useState<Suggestion[]>([]);
    const [highlightedSuggestion, setHighlightedSuggestion] = useState<Suggestion | null>(null);
    const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);

    const inputRef = useRef<HTMLInputElement>(null);
    const [inputStyles, setInputStyles] = useState({
        height: "auto",
        paddingLeft: "0px",
        fontSize: "inherit",
    });

    const resetTexts = () => {
        setInputValue('');
        setFilteredSuggestions([]);
        setHighlightedSuggestion(null);
        setActiveSuggestionIndex(-1);
    };

    useEffect(() => {
        if (inputRef.current) {
            const computedStyles = window.getComputedStyle(inputRef.current);
            setInputStyles({
                height: computedStyles.height,
                paddingLeft: computedStyles.paddingLeft,
                fontSize: computedStyles.fontSize,
            });
        }
    }, [inputValue]);

    useEffect(() => {
        setData(prev => ({
            ...prev,
            resetAutoCompleteTexts: resetTexts,
            setAutoCompleteInputValue: setInputValue
        }));
    }, []);

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setInputValue(value);

        if (value) {
            const matches = suggestions.filter((suggestion) =>
                suggestion.label.toLowerCase().startsWith(value.toLowerCase())
            );
            setFilteredSuggestions(matches);
            setActiveSuggestionIndex(-1);
            setHighlightedSuggestion(matches.length > 0 ? matches[0] : null);
        } else {
            setFilteredSuggestions([]);
            setHighlightedSuggestion(null);
        }
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "ArrowDown") {
            event.preventDefault();
            setActiveSuggestionIndex((prevIndex) =>
                Math.min(prevIndex + 1, filteredSuggestions.length - 1)
            );
        } else if (event.key === "ArrowUp") {
            event.preventDefault();
            setActiveSuggestionIndex((prevIndex) => Math.max(prevIndex - 1, 0));
        } else if (event.key === "Enter" && activeSuggestionIndex >= 0) {
            event.preventDefault();
            const selected = filteredSuggestions[activeSuggestionIndex];
            setInputValue(selected.label);
            onAddText(selected);
            setFilteredSuggestions([]);
            setHighlightedSuggestion(null);
            setActiveSuggestionIndex(-1);
        } else if (event.key === "Tab" && highlightedSuggestion) {
            event.preventDefault();
            setInputValue(highlightedSuggestion.label);
            onAddText(highlightedSuggestion);
            setFilteredSuggestions([]);
            setHighlightedSuggestion(null);
        }
    };

    useEffect(() => {
        if (activeSuggestionIndex >= 0) {
            setHighlightedSuggestion(filteredSuggestions[activeSuggestionIndex]);
        }
    }, [activeSuggestionIndex, filteredSuggestions]);

    const getRemainingSuggestion = () => {
        if (!highlightedSuggestion) return "";

        const {label} = highlightedSuggestion;
        if (!label.toLowerCase().startsWith(inputValue.toLowerCase())) {
            return "";
        }

        return label.slice(inputValue.length);
    };

    return (
        <div className="flex relative w-full">
            <div className="flex items-center">
                <div className="relative flex-1">
                    {/* Input container */}
                    <div className="relative w-full">
                        {/* Highlighted suggestion (gray text behind the input) */}
                        <div
                            className="absolute top-0 left-0 w-full pointer-events-none truncate"
                            style={{
                                height: inputStyles.height,
                                paddingLeft: inputStyles.paddingLeft,
                                fontSize: inputStyles.fontSize,
                                lineHeight: inputStyles.height,
                                color: "gray",
                            }}
                        >
                            {inputValue}
                            <span className="text-gray-400">{getRemainingSuggestion()}</span>
                        </div>
                        {/* User input (overlays the suggestion) */}
                        <Input
                            ref={inputRef}
                            type="text"
                            className="relative w-full bg-transparent border-none outline-none text-sm text-black"
                            value={inputValue}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            placeholder="Filter..."
                        />
                    </div>
                </div>
            </div>

            {/* Dropdown Suggestions */}
            {filteredSuggestions.length > 0 && (
                <ul className="
                absolute top-full
                left-0 w-full
                bg-white border
                border-gray-300
                rounded-md
                mt-1
                shadow-lg max-h-60 overflow-y-auto z-10 min-w-60">
                    {filteredSuggestions.map((suggestion, index) => (
                        <li
                            key={suggestion.key}
                            className={`px-4 py-2 text-sm cursor-pointer ${
                                index === activeSuggestionIndex
                                    ? "bg-blue-100"
                                    : "hover:bg-blue-100"
                            }`}
                            onMouseEnter={() => setActiveSuggestionIndex(index)}
                            onClick={() => {
                                onAddText(suggestion);
                                setInputValue(suggestion.label);
                                setFilteredSuggestions([]);
                                setHighlightedSuggestion(null);
                            }}
                        >
                            {suggestion.label}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default AutoComplete;
