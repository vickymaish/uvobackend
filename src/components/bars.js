import * as React from 'react';
import { useEffect, useState } from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import axios from 'axios';

const columns = [
  { field: 'customerName', headerName: 'Customer Name', width: 200 },
  { field: 'stats', headerName: 'Stats', width: 150 },
  { field: 'deadline', headerName: 'Deadline', width: 150 },
  { field: 'pages', headerName: 'Pages', width: 100 },
  { field: 'topic', headerName: 'Topic', width: 200 },
  { field: 'amount', headerName: 'Amount ($)', width: 150 },
  { field: 'totalPrice', headerName: 'Total Price ($)', width: 150 },
  { field: 'status', headerName: 'Status', width: 150 },
];

export default function BasicTable() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:5000/api/orders')
      .then(response => {
        console.log('Data fetched:', response.data); // Debugging statement
        setRows(response.data);
      })
      .catch(error => {
        console.error('Error fetching data:', error);
      });
  }, []);

  return (
    <TableContainer component={Paper} sx={{ maxHeight: 230, overflowY: 'scroll' }}>
      <Table sx={{ minWidth: 650 }} aria-label="simple table">
        <TableHead>
          <TableRow>
            {columns.map((column) => (
              <TableCell key={column.field} align="right" style={{ width: column.width }}>
                {column.headerName}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row._id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
              {columns.map((column) => (
                <TableCell key={column.field} align="right">
                  {row[column.field]}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}