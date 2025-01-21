"use client";
import React, {useEffect, useState} from "react";
import Filter from "@/app/components/Filter";
import {DrawbackTableContainer} from "@/app/components/DrawbackTable/DrawbackTable";
import {DataHubProvider} from "@/app/contexts/dataHubContexts";
import {useAxios} from "@/app/hooks/useAxios";

import {Claim} from "@/app/components/interfaces/filter";
import {AlertCircle} from "lucide-react";
import {Alert, AlertDescription, AlertTitle} from "@/components/ui/alert";
import {LoadingSpinner} from "@/app/components/LoadingSpinner";


export default function Home() {
    const {data, error, isLoading} = useAxios<{claims:Claim[]}>({
        path: '/claims'
    });

    const [claimData, setClaimData] = useState<Claim[]>([]);

    const onHandleSetClaimData = (claimData:Claim[]) => {
        setClaimData(claimData);
    };

    useEffect(() => {
        if(data&&Array.isArray(data.claims) && data.claims.length) {
            setClaimData(data.claims);
        }
    }, [JSON.stringify(data)]);

    if (isLoading) return <div className="flex w-full justify-center items-center h-dvh">
        <LoadingSpinner/>
    </div>;
    if (error) return <div className="flex w-full justify-center items-center"><Alert variant="destructive">
        <AlertCircle className="h-4 w-4"/>
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
            {error.message}
        </AlertDescription>
    </Alert></div>;


    return (<DataHubProvider>
            <div className="flex flex-1 flex-col gap-4 p-4">
                <div className="grid auto-rows-min gap-4 md:grid-cols-1">
                    <div className="rounded-xl bg-muted/50 p-4"><Filter claimData={claimData} onHandleSetClaimData={onHandleSetClaimData}/></div>
                </div>
                <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min p-4">
                    <DrawbackTableContainer claimData={claimData}/>
                </div>
            </div>
        </DataHubProvider>
    );
}
