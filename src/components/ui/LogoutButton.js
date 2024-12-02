// LogoutButton.js
import React from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css"; // Import Toastify CSS

function LogoutButton() {
  const handleLogout = () => {
    // Show the toast notification
    toast.success("Logged out successfully!", {
      position: "top-right", // Position of the toast
      autoClose: 1000, // Auto close after 3 seconds
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });

    // Perform logout logic here (e.g., clearing user data)
    setTimeout(() => {
      // Redirect to the login or home page after the toast
      window.location.href = "/login";
    }, 1000);
  };

  return (
    <div className="flex justify-center items-center">
      <button
        className="bg-red-500 text-white font-semibold py-2 px-6 rounded-lg shadow-md 
                hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 
                focus:ring-opacity-50 transition duration-300 ease-in-out"
        onClick={handleLogout}
      >
        LOGOUT
      </button>
    </div>
  );
}

export default LogoutButton;
