


import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Login from "../login";
import { CiLock } from "react-icons/ci";

import MenuIcon from "@mui/icons-material/Menu";

import { MdOutlineDashboard } from "react-icons/md";
import { FaMoneyBillWave } from "react-icons/fa6";
import { MdAccountCircle } from "react-icons/md";
import { IoIosSettings } from "react-icons/io";





const Sidebar = () => {
 
  const [isDashboardVisible, setIsDashboardVisible] = useState(true);


  const navigate = useNavigate()



 

 

  const handleLogout = (username) => {
    // setLoggedInAccounts(loggedInAccounts.map(account => 
    //   account.username === username ? { ...account, status: "inactive" } : account
    // ));
    navigate("/login");
 
  };



  

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
            <div onClick={()=> navigate('/dashboard')}  className="flex flex-row items-center gap-2 cursor-pointer">
            <MdOutlineDashboard />
            <p>DashBoard</p>
            </div>
            <div onClick={()=> navigate('/bids')} className="flex flex-row items-center gap-2 cursor-pointer">
            <FaMoneyBillWave />
            <p>Bids</p>
            </div>

            <div
            onClick={()=> navigate('/profile')}
            className="flex flex-row items-center gap-2 cursor-pointer">
            <MdAccountCircle />
            <p>Account</p>
            </div>
           
           <div className="flex flex-row items-center gap-2 cursor-pointer">
           <IoIosSettings />
           <p>Settings</p>
           <CiLock />
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
    
    <div className={`flex-grow ${isDashboardVisible ? "w-[80%]" : "w-[90%]"} transition-all duration-300`}>
      {/* Toggle Button */}
      <div className="p-3 bg-gray-100 flex items-center">
        <button onClick={toggleDashboard} className="text-gray-600">
          <MenuIcon />
        </button>
      </div>

      {/* Content */}
      
    </div>
  </div>
  );
};

export default Sidebar;