// LoginButton.js
import React from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css"; // Import Toastify CSS

function LoginButton() {
  const handleLogin = () => {
    // Show the toast notification
    toast.success("Logged in successfully!", {
      position: "top-right", // Position of the toast
      autoClose: 1000,       // Auto close after 1 second
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });

    // Perform login logic here (e.g., setting user data)
    setTimeout(() => {
      // Redirect to the dashboard or homepage after the toast
      window.location.href = "/dashboard";
    }, 1000);
  };

  return (
    <div className="flex justify-center items-center">
      <button
        className="bg-green-500 text-white font-semibold py-2 px-6 rounded-lg shadow-md 
                hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 
                focus:ring-opacity-50 transition duration-300 ease-in-out"
        onClick={handleLogin}
      >
        LOGIN
      </button>
    </div>
  );
}

export default LoginButton;
