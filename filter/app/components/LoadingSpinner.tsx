"use client";
import React from "react";
import {Grid} from 'react-loader-spinner'


const LoadingSpinner = () => {
    return <div className="flex justify-center align-middle flex-col">
        <Grid
            visible={true}
            height="80"
            width="80"
            color="rgb(54, 215, 183)"
            ariaLabel="grid-loading"
            radius="12.5"
            wrapperStyle={{}}
            wrapperClass="grid-wrapper"
        />
        <div className="flex justify-center align-middle mt-2">Loading...</div>
    </div>
}

export {LoadingSpinner}