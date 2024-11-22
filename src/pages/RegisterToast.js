// RegisterButton.js
import React from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css"; // Import Toastify CSS

function RegisterButton() {
  const handleRegister = () => {
    // Show the toast notification
    toast.success("Registered successfully!", {
      position: "top-right", // Position of the toast
      autoClose: 1000,       // Auto close after 1 second
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });

    // Perform registration logic here (e.g., sending user data to the server)
    setTimeout(() => {
      // Redirect to the login or welcome page after the toast
      window.location.href = "/login";
    }, 1000);
  };

  return (
    <div className="flex justify-center items-center">
      <button
        className="bg-blue-500 text-white font-semibold py-2 px-6 rounded-lg shadow-md 
                hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 
                focus:ring-opacity-50 transition duration-300 ease-in-out"
        onClick={handleRegister}
      >
        REGISTER
      </button>
    </div>
  );
}

export default RegisterButton;
