import { useEffect, useMemo, useState } from 'react';
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table';
import { useNavigate } from 'react-router-dom';

const TransactionTable = ({ tripid }) => {
	const [data, setData] = useState([]);
	const [isError, setIsError] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [isRefetching, setIsRefetching] = useState(false);
	const [rowCount, setRowCount] = useState(0);

	const [columnFilters, setColumnFilters] = useState([]);
	const [globalFilter, setGlobalFilter] = useState('');
	const [sorting, setSorting] = useState([]);
	const [pagination, setPagination] = useState({
		pageIndex: 0,
		pageSize: 10,
	});

	useEffect(() => {
		const fetchData = async () => {
			if (!data.length) {
				setIsLoading(true);
			} else {
				setIsRefetching(true);
			}

			try {
				const response = await fetch(`${process.env.REACT_APP_API_URL}/getTripTransactions`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						token: localStorage.getItem('authToken'),
						tripid: tripid,
					}),
				});
				const json = await response.json();
				if (json.success) {
					setData(json.data.transactions);
					setRowCount(json.data.transactions.length);
					console.log(json.data);
					if (json.newAuthToken) localStorage.setItem('authToken', json.newAuthToken);
				} else {
					localStorage.removeItem('authToken');
					localStorage.setItem('forcedLogOut', true);
					navigate('/profile');
				}
			} catch (error) {
				setIsError(true);
				console.error('Error fetching userData :', error);
				return;
			}
			setIsError(false);
			setIsLoading(false);
			setIsRefetching(false);
		};
		if (tripid) fetchData();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [tripid]);

	const columns = useMemo(
		() => [
			{
				accessorKey: 'amt',
				header: 'Amount',
			},
			{
				accessorKey: 'name',
				header: 'Reason',
			},
			{
				accessorKey: 'owner.name',
				header: 'Trip Owner',
			},
			{
				accessorFn: originalRow =>
					new Date(originalRow.dateCreated).toLocaleString('en-US', {
						year: 'numeric',
						month: 'long',
						day: 'numeric',
						hour: '2-digit',
						minute: '2-digit',
						second: '2-digit',
					}),
				id: 'dateCreated',
				header: 'Created On',
			},
			{
				accessorFn: originalRow =>
					new Date(originalRow.lastEdited).toLocaleString('en-US', {
						year: 'numeric',
						month: 'long',
						day: 'numeric',
						hour: '2-digit',
						minute: '2-digit',
						second: '2-digit',
					}),
				id: 'lastEdited',
				header: 'Last Modified',
			},
			{
				accessorKey: 'currentStatus',
				header: 'Status',
			},
		],
		[]
	);
	const navigate = useNavigate();
	const table = useMaterialReactTable({
		columns,
		data,
		enableRowSelection: false,
		enableColumnFilters: false,
		getRowId: row => row._id,
		initialState: { showColumnFilters: false },
		manualFiltering: false,
		manualPagination: false,
		manualSorting: false,
		muiToolbarAlertBannerProps: isError
			? {
					color: 'error',
					children: 'Error loading data',
			  }
			: undefined,
		onColumnFiltersChange: setColumnFilters,
		onGlobalFilterChange: setGlobalFilter,
		onPaginationChange: setPagination,
		onSortingChange: setSorting,
		rowCount,
		state: {
			columnFilters,
			globalFilter,
			isLoading,
			pagination,
			showAlertBanner: isError,
			showProgressBars: isRefetching,
			sorting,
		},
		muiTableBodyRowProps: ({ row }) => ({
			onClick: () => {
				// console.log(row.id);
				navigate('/transaction', {
					state: { transactionid: row.id, tripid: tripid },
				});
			},
			sx: {
				cursor: 'pointer',
			},
		}),
	});

	return <MaterialReactTable table={table} />;
};

export default TransactionTable;
