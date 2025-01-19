import Sidebar from "../components/sidebar"
import Avatar from '@mui/material/Avatar';
import { FaCircle } from "react-icons/fa";
import { DataGrid } from "@mui/x-data-grid";


const AccountsPage = ()=>{

   const dummyData = {
      role: 'Super Admin',
      firstName: "Test",
      lastName:"Admin",
      loggedIn:'-',
      status: 'Active',
      otherAccounts:[
         {
            role: 'Writer',
            firstName: "User",
            lastName:"001",
            loggedIn:'-',
            status: 'Inactive',
         },
         {
            role: 'Writer',
            firstName: "User",
            lastName:"002",
            loggedIn:'-',
            status: 'Inactive',
         },
         {
            role: 'Writer',
            firstName: "User",
            lastName:"003",
            loggedIn:'-',
            status: 'Active',
         },
          {
            role: 'Writer',
            firstName: "User",
            lastName:"004",
            loggedIn:'-',
            status: 'Active',
         },
          {
            role: 'Writer',
            firstName: "User",
            lastName:"005",
            loggedIn:'-',
            status: 'Active',
         }
      ]
   }

   const columns = [
      { field: "firstName", headerName: "First Name", width: 200 },
      { field: "lastName", headerName: "Last Name", width: 200 },
      { field: "role", headerName: "Role", width: 150 },
      { field: "loggedInAt", headerName: "Logged In", width: 200 },
      { field: "loggedIOutAt", headerName: "Logged Out", width: 200 },
      { field: "hours", headerName: "Hours Logged In", width: 200 },  
    ];

    const rows = []




     return(

        <div className="relative">
          <div className="w-[100vw]">
        <Sidebar />
      </div>
      <div className="absolute top-14 left-[290px] w-[80%]">
         <div className="flex flex-row mt-8 ml-4 gap-4">

            <div className="relative w-1/2 grid place-items-center border shadow-lg rounded-lg  h-[25em]">
               <div className="border rounded-lg p-4 grid place-content-center h-[12em] mt-2 w-[60%]">
               <Avatar sx={{ width: 150, height: 150 }}>TA</Avatar>
               </div>
               <div className="space-y-2 mt-4">
                  <p><span className="font-bold">Name:</span><span className="text-stone-400">{dummyData.firstName} {dummyData.lastName} </span></p>
                  <p><span className="font-bold">Role:</span><span className="text-stone-400">{dummyData.role}</span></p>
               </div>
               <div className="flex flex-row items-center gap-2 absolute top-4 right-10">
               <FaCircle className="text-green-500"/>
                  <p className="text-stone-500 text-sm">Active</p>
               </div>
            
            </div>
            <div className="relative w-1/2 border shadow-lg rounded-lg overflow-y-scroll  h-[25em]">
               <p className="text-center mt-2 font-bold">Accounts Managed</p>
               {dummyData.otherAccounts.map(data => (
               <div className="flex flex-row justify-between items-center border-b py-4">

                        <div className="flex flex-row items-center gap-2 ml-4 my-4">
                        <Avatar sx={{ width: 30, height: 30 }}>U</Avatar>
                       <p>{data.firstName} {data.lastName}</p>
                        </div>

                        <div className="flex flex-row items-center gap-2 mr-4">
                        <FaCircle className="text-red-500"/>
                  <p className="text-stone-500">Inactive</p>
                        </div>
                  
                  

               
               </div>
               ))
            }
            </div>
         </div>
         <div className="mt-6">
         <DataGrid rows={rows} columns={columns} />
         </div>
         
         
        
         
     

      </div>
        </div>
     )
}


export default AccountsPage