import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import Login from "../login";

import MenuIcon from "@mui/icons-material/Menu";
import { LuBadgeDollarSign } from "react-icons/lu";
import { MdOutlineDashboard } from "react-icons/md";
import { FaMoneyBillWave } from "react-icons/fa6";
import { MdAccountCircle } from "react-icons/md";
import { IoIosSettings } from "react-icons/io";
import Gauge from "../components/gauge";
import BasicLineChart from "../components/linechart";
import BasicTable from "../components/bars";

const accounts = [
  { username: "admin", password: "password", status: "active" },
  { username: "user1", password: "password1", status: "active" },
  { username: "user2", password: "password2", status: "active" },
  // Add more accounts as needed
];

const Dashboard = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loggedInAccounts, setLoggedInAccounts] = useState(accounts);
  const [isDashboardVisible, setIsDashboardVisible] = useState(true);
  const [orders, setOrders] = useState([]);
  const [fulfillmentRate, setFulfillmentRate] = useState(0);
  const [earnings, setEarnings] = useState(0);

  const navigate = useNavigate();

  useEffect(() => {
    axios.get('http://localhost:5000/api/orders')
      .then(response => {
        setOrders(response.data);
        calculateFulfillmentRate(response.data);
        calculateEarnings(response.data);
      })
      .catch(error => {
        console.error('Error fetching data:', error);
      });
  }, []);

  const calculateFulfillmentRate = (orders) => {
    const totalOrders = orders.length;
    const completedOrders = orders.filter(order => order.status === 'Completed').length;
    const rate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;
    setFulfillmentRate(rate);
  };

  const calculateEarnings = (orders) => {
    const totalEarnings = orders
      .filter(order => order.status === 'Completed')
      .reduce((sum, order) => sum + order.totalPrice, 0);
    setEarnings(totalEarnings);
  };

  const handleLogin = (username) => {
    setIsAuthenticated(true);
    setLoggedInAccounts(
      loggedInAccounts.map((account) =>
        account.username === username
          ? { ...account, status: "active" }
          : account
      )
    );
  };

  const handleLogout = (username) => {
    setLoggedInAccounts(
      loggedInAccounts.map((account) =>
        account.username === username
          ? { ...account, status: "inactive" }
          : account
      )
    );
    navigate("/login");
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  const toggleDashboard = () => {
    setIsDashboardVisible((prev) => !prev);
  };

  
  return (
    <div className="flex">
      {/* Sidebar/Dashboard */}
      {isDashboardVisible && (
        <div className="w-[20%] h-screen bg-[#466995] text-white transition-all duration-300">
          <div className="mt-6 grid place-items-center">
            <div>
              <p>Uvotake</p>
            </div>
            <div className="flex flex-col gap-8 my-10">
              <div
                onClick={() => navigate("/dashboard")}
                className="flex flex-row items-center gap-2 cursor-pointer"
              >
                <MdOutlineDashboard />
                <p>DashBoard</p>
              </div>
              <div
                onClick={() => navigate("/bids")}
                className="flex flex-row items-center gap-2 cursor-pointer"
              >
                <FaMoneyBillWave />
                <p>Bids</p>
              </div>

              <div className="flex flex-row items-center gap-2 cursor-pointer">
                <MdAccountCircle />
                <p>Account</p>
              </div>

              <div className="flex flex-row items-center gap-2 cursor-pointer">
                <IoIosSettings />
                <p>Settings</p>
              </div>
            </div>
          </div>
          <div className="absolute bottom-0 bg-red-700 w-[288px] py-2 cursor-pointer transition-all duration-300">
            <div className="flex justify-center">
              <button onClick={() => handleLogout()}>Log Out</button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}

      <div
        className={`flex-grow ${
          isDashboardVisible ? "w-[80%]" : "w-[90%]"
        } transition-all duration-300 bg-gray-200`}
      >
        {/* Toggle Button */}

        <div className="p-3 bg-gray-100 flex items-center">
          <button onClick={toggleDashboard} className="text-gray-600">
            <MenuIcon />
          </button>
        </div>

        {/* Content */}
        <div className="border bg-white h-[90%] w-[98%] ml-4 px-4 mt-7 rounded-lg shadow-2xl ">
          <div className="border mt-4 flex flex-row gap-4 p-4 h-[280px]">
            <div className="border rounded-lg h-[200px] w-1/3 grid place-content-center">
              <p>Order fulfillment rate</p>
              <Gauge value={fulfillmentRate} />
              <p className="text-center text-lg">{fulfillmentRate.toFixed(2)}%</p>
            </div>
            <div className="border rounded-lg h-[200px] w-2/3 ">
              <p className="text-center">Orders received today</p>
              <BasicLineChart />
            </div>
          </div>
          <div className="flex flex-col h-[400px]">
            <div className="border mt-4 flex flex-row gap-4 p-4 ">
              <div className="border h-[80px] p-4 w-1/2 flex flex-row rounded-lg ">
                <div className="flex flex-row items-center ">
                  <LuBadgeDollarSign className="text-2xl bg-emerald-200 w-10 h-10 rounded-full" />
                </div>
                <div className="ml-4">
                  <p className="text-xs text-stone-600">Earnings</p>
                  <p>{earnings} USD</p>
                </div>
              </div>
              <div className="border h-[80px] p-4 w-1/2 flex flex-row rounded-lg ">
                <div className="flex flex-row items-center ">
                  <LuBadgeDollarSign className="text-2xl bg-emerald-200 w-10 h-10 rounded-full" />
                </div>
                <div className="ml-4">
                  <p className="text-xs text-stone-600">Orders not Taken</p>
                  <p>89USD</p>
                </div>
              </div>
            </div>
            <div className="mt-6 border p-4">
              <BasicTable />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;