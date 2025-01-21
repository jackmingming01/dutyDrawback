"use client";
import React, {useState, useEffect} from "react";
import {ColumnDef} from "@tanstack/react-table";
import DataTable from "@/app/components/DrawbackTable/DataTable";
import {Claim} from "@/app/components/interfaces/filter";

import {useDataHub} from "@/app/contexts/dataHubContexts";

interface DrawbackTableContainerProps {
    claimData: Claim[]
}

interface DrawbackTableProps {
    claims: Claim[]
}


export const DrawbackTableContainer: React.FC<DrawbackTableContainerProps> = ({claimData}) => {
    const {setData: setTableDataContexts, data: tableDataContexts, getData: getTableData} = useDataHub();
    const [claims, setClaims] = useState<Claim[]>(claimData);

    useEffect(() => {
        if (Array.isArray(claimData) && claimData.length) {
            setClaims(claimData);

            if (!tableDataContexts.originalClaims) {
                setTableDataContexts(prev => ({
                    ...prev,
                    originalClaims: [...claimData]
                }));
            }
        }

    }, [JSON.stringify(claimData)]);

    return (
        <>
            <DrawbackTable claims={claims}/>
        </>
    )
};

export const DrawbackTable: React.FC<DrawbackTableProps> = ({claims}) => {
    const columns = React.useMemo<ColumnDef<Claim>[]>(
        () => [
            {
                accessorKey: 'claimID',
                header: () => 'Claim ID',
                cell: (info) => info.getValue(),
                footer: (props) => props.column.id,
            },
            {
                accessorFn: (row) => row.importerName,
                id: 'importerName',
                cell: (info) => info.getValue(),
                header: () => <span>Importer Name</span>,
                footer: (props) => props.column.id,
            },
            {
                accessorKey: 'HTSCode',
                header: () => <span>HTS Code</span>,
                footer: (props) => props.column.id,
            },
            {
                accessorKey: 'importDate',
                header: () => <span>Import Date</span>,
                footer: (props) => props.column.id,
            },
            {
                accessorKey: 'importQuantity',
                header: () => <span>Import Quantity</span>,
                footer: (props) => props.column.id,
            },
            {
                accessorKey: 'dutiesPaid',
                header: () => <span>Duties Paid</span>,
                footer: (props) => props.column.id,
            },
            {
                accessorKey: 'drawbackClaimed',
                header: () => <span>Drawback Claimed</span>,
                footer: (props) => props.column.id,
            }
        ],
        []
    );
    const [data, setData] = useState<Claim[]>(claims);

    useEffect(() => {
        if (claims) {
            setData(claims);
        }
    }, [JSON.stringify(claims)])

    return (
        <>
            <DataTable
                {...{
                    data,
                    columns,
                }}
            />
        </>
    );
}

