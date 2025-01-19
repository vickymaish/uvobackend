// src/components/OrderList.js
import React, { useState, useEffect } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import axios from 'axios';
import { Box } from '@mui/material';


const columns = [
  { field: 'id', headerName: 'ID', width: 100 },
  { field: 'date', headerName: 'Date', width: 150 },
  { field: 'item', headerName: 'Item', width: 200 },
  { field: 'customer', headerName: 'Customer', width: 200 },
  { field: 'stats', headerName: 'Stats', width: 200 },
  { field: 'deadline', headerName: 'Deadline', width: 200 },
  { field: 'pages', headerName: 'Pages', width: 100 },
  { field: 'topic', headerName: 'Topic', width: 200 },
  { field: 'amount', headerName: 'Amount ($)', width: 150 },
];

const OrderList = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Function to fetch orders
    const fetchOrders = async () => {
      setLoading(true);
      try {
        // Replace with your actual API endpoint to fetch orders
        const response = await axios.get('http://localhost:5000/api/orders');
        setRows(response.data);  // Assuming data is in the format you want
      } catch (err) {
        setError('Failed to fetch orders');
      }
      setLoading(false);
    };

    fetchOrders();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div>
      <Box sx={{ height: 400, backgroundColor: 'white', borderRadius: 2 }}>
        <DataGrid rows={rows} columns={columns} />
      </Box>
    </div>
  );
};

export default OrderList;